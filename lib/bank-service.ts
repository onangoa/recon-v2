import { prisma } from './prisma';
import { notifyBankTopupConfirmedForWallet } from './sms-notifications';

// ============ Co-op Bank OpenAPI Configuration ============
const COOP_BASE_URL = process.env.COOP_BANK_BASE_URL || 'https://openapi.co-opbank.co.ke';
const AUTH_TOKEN = process.env.COOP_BANK_AUTH_TOKEN || '';
const DEFAULT_USER_ID = process.env.COOP_BANK_USER_ID || 'RECON';
const DEFAULT_SOURCE_ACCOUNT = process.env.COOP_BANK_SOURCE_ACCOUNT || '';
const FUNDS_TRANSFER_CALLBACK = process.env.COOP_BANK_CALLBACK_URL || 'https://reconsmi.com/v1/ext/ipn';
const BANK_IPN_DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

// In-memory token cache (refreshes ~5min before expiry)
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

const basicAuthHeader = () => {
  return 'Basic ' + AUTH_TOKEN; //Buffer.from(credentials).toString('base64');
};

// ============ 1. Generate Token (OAuth2 client_credentials) ============
export async function getBankToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry - 5 * 60 * 1000) {
    return cachedToken;
  }

  if (!AUTH_TOKEN) {
    throw new Error('Co-op Bank credentials not configured (COOP_BANK_AUTH_TOKEN)');
  }

  const response = await fetch(`${COOP_BASE_URL}/token`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch Co-op Bank token (${response.status}): ${text}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  // expires_in is in seconds; default to 3600 if missing
  tokenExpiry = now + (data.expires_in ? data.expires_in * 1000 : 3600 * 1000);

  if (!cachedToken) {
    throw new Error('No access_token returned from Co-op Bank');
  }

  return cachedToken;
};

// Helper that performs an authenticated POST to a Co-op Bank resource
const bankPost = async (path: string, body: any) => {
  const token = await getBankToken();
  const url = path.endsWith('/') ? `${COOP_BASE_URL}${path}` : `${COOP_BASE_URL}${path}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let parsed: any = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { rawResponse: text };
  }

  if (!response.ok) {
    throw new Error(`Co-op Bank ${path} failed (${response.status}): ${text}`);
  }

  return parsed;
};

// Generate a short unique message reference (matches Postman examples)
const generateMessageReference = (): string => {
  return Math.random().toString(16).slice(2, 14) + Date.now().toString(16).slice(-4);
};

// ============ 2. Account Validation (IPSL) ============
export async function validateBankAccount(data: {
  accountNumber: string;
  recipientBankIdentifier?: string;
  userId?: string;
  messageReference?: string;
}) {
  const payload = {
    MessageReference: data.messageReference || generateMessageReference(),
    UserId: data.userId || DEFAULT_USER_ID,
    AccountNumber: data.accountNumber,
    RecipientBankIdentifier: data.recipientBankIdentifier || '0011',
  };

  return await bankPost('/Enquiry/Validation/IPSL/1.0.0/', payload);
};

// ============ 3. PesaLink Send to Account (External bulk transfer) ============
export async function sendPesalink(data: {
  sourceAccountNumber?: string;
  destinations: Array<{
    accountNumber: string;
    bankCode: string;
    amount: number | string;
    narration?: string;
  }>;
  userId?: string;
  callBackUrl?: string;
  iso2CountryCode?: string;
  amount?: number;
  narration?: string;
}) {
  const messageReference = generateMessageReference();
  const sourceAccount = data.sourceAccountNumber || DEFAULT_SOURCE_ACCOUNT;
  const totalAmount = data.amount ?? data.destinations.reduce((sum, d) => sum + Number(d.amount), 0);

  const payload = {
    MessageReference: messageReference,
    UserId: data.userId || DEFAULT_USER_ID,
    CallBackUrl: data.callBackUrl || FUNDS_TRANSFER_CALLBACK,
    ISO2CountryCode: data.iso2CountryCode || 'KE',
    Source: {
      AccountNumber: sourceAccount,
      Amount: totalAmount,
      TransactionCurrency: 'KES',
      Narration: data.narration || 'Wallet Payout',
    },
    Destinations: data.destinations.map((d, i) => ({
      ReferenceNumber: `${messageReference}_${i + 1}`,
      AccountNumber: d.accountNumber,
      BankCode: d.bankCode,
      Amount: d.amount,
      TransactionCurrency: 'KES',
      Narration: d.narration || data.narration || 'Wallet Payout',
    })),
  };

  const result = await bankPost('/FundsTransfer/External/A2A/PesaLink_v2/2.0.0/', payload);
  return { messageReference, result };
};

// ============ 4. IFT Send to Account (Intra-bank / Co-op to Co-op) ============
export async function sendIFT(data: {
  sourceAccountNumber?: string;
  destinations: Array<{
    accountNumber: string;
    amount: number | string;
    narration?: string;
  }>;
  userId?: string;
  callBackUrl?: string;
  iso2CountryCode?: string;
  amount?: number;
  narration?: string;
}) {
  const messageReference = generateMessageReference();
  const sourceAccount = data.sourceAccountNumber || DEFAULT_SOURCE_ACCOUNT;
  const totalAmount = data.amount ?? data.destinations.reduce((sum, d) => sum + Number(d.amount), 0);

  const payload = {
    MessageReference: messageReference,
    UserId: data.userId || DEFAULT_USER_ID,
    ISO2CountryCode: data.iso2CountryCode || 'KE',
    CallBackUrl: data.callBackUrl || FUNDS_TRANSFER_CALLBACK,
    Source: {
      AccountNumber: sourceAccount,
      Amount: totalAmount,
      TransactionCurrency: 'KES',
      Narration: data.narration || 'Wallet Payout (IFT)',
    },
    Destinations: data.destinations.map((d, i) => ({
      ReferenceNumber: `${messageReference}_${i + 1}`,
      AccountNumber: d.accountNumber,
      Amount: d.amount,
      TransactionCurrency: 'KES',
      Narration: d.narration || data.narration || 'Wallet Payout (IFT)',
    })),
  };

  const result = await bankPost('/FundsTransfer/Internal/A2A_v3/3.0.0', payload);
  return { messageReference, result };
};

// ============ 5. B2C M-Pesa (Send from bank account to M-Pesa) ============
export async function sendB2CMpesa(data: {
  sourceAccountNumber?: string;
  destinations: Array<{
    mobileNumber: string;
    amount: number | string;
    narration?: string;
  }>;
  userId?: string;
  callBackUrl?: string;
  iso2CountryCode?: string;
  amount?: number;
  narration?: string;
}) {
  const messageReference = generateMessageReference();
  const sourceAccount = data.sourceAccountNumber || DEFAULT_SOURCE_ACCOUNT;
  const totalAmount = data.amount ?? data.destinations.reduce((sum, d) => sum + Number(d.amount), 0);

  const payload = {
    MessageReference: messageReference,
    UserId: data.userId || DEFAULT_USER_ID,
    ISO2CountryCode: data.iso2CountryCode || 'KE',
    CallBackUrl: data.callBackUrl || FUNDS_TRANSFER_CALLBACK,
    Source: {
      AccountNumber: sourceAccount,
      Amount: String(totalAmount),
      TransactionCurrency: 'KES',
      Narration: data.narration || 'Wallet Payout to M-Pesa',
    },
    Destinations: data.destinations.map((d, i) => ({
      ReferenceNumber: `${messageReference}_${i + 1}`,
      MobileNumber: d.mobileNumber,
      Amount: String(d.amount),
      Narration: d.narration || data.narration || 'Wallet Payout to M-Pesa',
    })),
  };

  const result = await bankPost('/FundsTransfer/External/A2M/Mpesa_v2/2.0.0', payload);
  return { messageReference, result };
};

// ============ 6. Transaction Status Check ============
export async function checkBankTransactionStatus(data: {
  messageReference: string;
  userId?: string;
}) {
  const payload = {
    MessageReference: data.messageReference,
    UserId: data.userId || DEFAULT_USER_ID,
  };

  return await bankPost('/Enquiry/TransactionStatus_V3/3.0.0/', payload);
};

// ============ 7. Account Balance ============
export async function getAccountBalance(data: {
  accountNumber?: string;
  userId?: string;
  messageReference?: string;
}) {
  const payload = {
    MessageReference: data.messageReference || generateMessageReference(),
    UserId: data.userId || DEFAULT_USER_ID,
    AccountNumber: data.accountNumber || DEFAULT_SOURCE_ACCOUNT,
  };

  return await bankPost('/Enquiry/AccountBalance_v2/2.0.0/', payload);
};

// ============ 8. Account Mini-Statement ============
export async function getMiniStatement(data: {
  accountNumber?: string;
  messageReference?: string;
}) {
  const payload = {
    MessageReference: data.messageReference || generateMessageReference(),
    AccountNumber: data.accountNumber || DEFAULT_SOURCE_ACCOUNT,
  };

  return await bankPost('/Enquiry/MiniStatement/Account_v2/2.0.0/', payload);
};

// ============ 9. Account Full Statement (Paginated) ============
export async function getFullStatement(data: {
  accountNumber?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  userId?: string;
  iso2CountryCode?: string;
  messageReference?: string;
}) {
  const payload = {
    MessageReference: data.messageReference || generateMessageReference(),
    UserId: data.userId || DEFAULT_USER_ID,
    ISO2CountryCode: data.iso2CountryCode || 'KE',
    AccountNumber: data.accountNumber || DEFAULT_SOURCE_ACCOUNT,
    StartDate: data.startDate,
    EndDate: data.endDate,
  };

  return await bankPost('/Enquiry/AccountFullStatementPaginated/1.0.0/', payload);
};

// ============ Wallet Integration Helpers ============

/**
 * Initiate a bank-funded wallet top-up.
 * Validates the sender's bank account, then creates a `pending` credit
 * transaction. The credit is completed once the bank transfer callback
 * confirms receipt into the company bank account.
 */
export async function initiateBankTopup(data: {
  walletId: string;
  amount: number;
  accountNumber: string;
  bankCode?: string;
  description?: string;
  referenceNumber?: string;
  recipientName?: string;
  proofDocumentUrl?: string;
  proofDocumentName?: string;
}) {
  const wallet = await prisma.wallet.findUnique({ where: { id: data.walletId } });
  if (!wallet) throw new Error(`Wallet ${data.walletId} not found`);

  // Validate the sender's bank account (IPSL validation)
  const validation = await validateBankAccount({
    accountNumber: data.accountNumber,
    recipientBankIdentifier: data.bankCode || '0011',
  });

  const messageReference = generateMessageReference();

  const transaction = await prisma.transaction.create({
    data: {
      walletId: data.walletId,
      amount: data.amount,
      type: 'credit',
      description: data.description || `Bank top-up from ${data.accountNumber}`,
      reference: data.referenceNumber || messageReference,
      externalId: messageReference,
      transactionType: 'BANK_TOPUP',
      accountReference: data.accountNumber,
      remarks: data.bankCode || 'BANK',
      status: 'pending',
      recipientName: data.recipientName || null,
      proofDocumentUrl: data.proofDocumentUrl || null,
      proofDocumentName: data.proofDocumentName || null,
      metadata: JSON.stringify({
        bankTransfer: true,
        senderAccount: data.accountNumber,
        bankCode: data.bankCode,
        validationResponse: validation,
      }),
    },
  });

  return {
    transaction,
    messageReference,
    validation,
    message: 'Bank account validated. Top-up is pending confirmation of receipt.',
  };
};

/**
 * Initiate a bank payout (debit) from a wallet. Creates a pending_approval
 * transaction; the actual funds transfer is executed on approval via the
 * approvals endpoint.
 */
export async function createBankPayout(data: {
  walletId: string;
  amount: number;
  destinationAccount: string;
  bankCode?: string;
  mobileNumber?: string;
  payoutChannel: 'pesalink' | 'ift' | 'mpesa';
  description?: string;
  referenceNumber?: string;
  recipientName?: string;
  proofDocumentUrl?: string;
  proofDocumentName?: string;
}) {
  const wallet = await prisma.wallet.findUnique({ where: { id: data.walletId } });
  if (!wallet) throw new Error(`Wallet ${data.walletId} not found`);

  if (wallet.balance < data.amount) {
    throw new Error('Insufficient wallet balance for bank payout');
  }

  const transactionType =
    data.payoutChannel === 'pesalink' ? 'BANK_PESALINK'
    : data.payoutChannel === 'ift' ? 'BANK_IFT'
    : 'BANK_MPESA';

  const transaction = await prisma.transaction.create({
    data: {
      walletId: data.walletId,
      amount: data.amount,
      type: 'debit',
      description: data.description || `Bank payout to ${data.destinationAccount || data.mobileNumber}`,
      reference: data.referenceNumber,
      transactionType,
      accountReference: data.destinationAccount || data.mobileNumber,
      remarks: data.payoutChannel,
      phoneNumber: data.mobileNumber,
      status: 'pending_approval',
      recipientName: data.recipientName || null,
      proofDocumentUrl: data.proofDocumentUrl || null,
      proofDocumentName: data.proofDocumentName || null,
      metadata: JSON.stringify({
        bankPayout: true,
        destinationAccount: data.destinationAccount,
        bankCode: data.bankCode,
        mobileNumber: data.mobileNumber,
        payoutChannel: data.payoutChannel,
      }),
    },
  });

  return { transaction, message: 'Bank payout created and pending approval' };
};

/**
 * Execute an approved bank payout by calling the appropriate Co-op Bank
 * funds transfer endpoint. Used by the approvals route.
 */
export async function executeBankPayout(
  transactionId: string
): Promise<any> {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { wallet: true },
  });

  if (!transaction) throw new Error('Transaction not found');
  if (transaction.status !== 'pending_approval') {
    throw new Error('Transaction is not pending approval');
  }

  let meta: any = {};
  try {
    meta = transaction.metadata ? JSON.parse(transaction.metadata) : {};
  } catch {
    // ignore
  }

  const payoutChannel: 'pesalink' | 'ift' | 'mpesa' =
    (meta.payoutChannel as any) || (transaction.remarks as any) || 'pesalink';

  let response: any;

  if (payoutChannel === 'mpesa') {
    if (!meta.mobileNumber && !transaction.phoneNumber) {
      throw new Error('Mobile number is required for M-Pesa bank payout');
    }
    response = await sendB2CMpesa({
      destinations: [{
        mobileNumber: meta.mobileNumber || transaction.phoneNumber,
        amount: transaction.amount,
        narration: transaction.description || transaction.transactionDesc || 'Wallet payout to M-Pesa',
      }],
      narration: (transaction.description || transaction.transactionDesc) ?? undefined,
    });
  } else if (payoutChannel === 'ift') {
    if (!meta.destinationAccount && !transaction.accountReference) {
      throw new Error('Destination account is required for IFT payout');
    }
    response = await sendIFT({
      destinations: [{
        accountNumber: meta.destinationAccount || transaction.accountReference,
        amount: transaction.amount,
        narration: transaction.description || transaction.transactionDesc || 'Wallet IFT payout',
      }],
      narration: (transaction.description || transaction.transactionDesc) ?? undefined,
    });
  } else {
    // pesalink
    if (!meta.destinationAccount && !transaction.accountReference) {
      throw new Error('Destination account is required for PesaLink payout');
    }
    response = await sendPesalink({
      destinations: [{
        accountNumber: meta.destinationAccount || transaction.accountReference,
        bankCode: meta.bankCode || '11',
        amount: transaction.amount,
        narration: transaction.description || transaction.transactionDesc || 'Wallet PesaLink payout',
      }],
      narration: (transaction.description || transaction.transactionDesc) ?? undefined,
    });
  }

  const messageReference = response.messageReference;

  // Mark as pending (awaiting callback) and store the message reference
  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      status: 'pending',
      externalId: messageReference,
      reference: messageReference,
      originatorConversationId: messageReference,
      rawApiResponse: JSON.stringify(response.result),
    },
  });

  return {
    transactionId,
    messageReference,
    bankResponse: response.result,
  };
};

/**
 * Handle the Co-op Bank funds-transfer callback (asynchronous result).
 * Completes a debit (payout) or credit (top-up) and adjusts the wallet.
 */
export async function handleBankFundsTransferCallback(callbackData: any) {
  try {
    const messageReference =
      callbackData?.MessageReference ||
      callbackData?.messageReference ||
      callbackData?.OriginatorConversationID;

    if (!messageReference) {
      return { success: false, error: 'MessageReference missing in callback' };
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        OR: [
          { externalId: messageReference },
          { reference: messageReference },
          { originatorConversationId: messageReference },
        ],
      },
      include: { wallet: true },
    });

    if (!transaction) {
      console.warn(`Bank funds-transfer callback: transaction not found for ${messageReference}`);
      return { success: false, error: 'Transaction not found' };
    }

    // Determine success from the bank callback. Co-op returns a Status field
    // ("Completed"/"Success" etc.) - we treat absence of an error code as success.
    const status =
      callbackData?.Status ||
      callbackData?.status ||
      callbackData?.Result?.ResultDesc ||
      callbackData?.ResultDescription ||
      'Completed';

    const isSuccess = /completed|success|ok|0/i.test(String(status)) && !/fail|error|invalid/i.test(String(status));

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        rawCallbackData: JSON.stringify(callbackData),
        callbackReceivedAt: new Date(),
        resultDesc: String(status),
      },
    });

    if (isSuccess) {
      if (transaction.type === 'credit') {
        // Top-up: increase wallet balance
        await prisma.wallet.update({
          where: { id: transaction.walletId },
          data: { balance: { increment: transaction.amount } },
        });
      } else {
        // Payout: decrease wallet balance
        await prisma.wallet.update({
          where: { id: transaction.walletId },
          data: { balance: { decrement: transaction.amount } },
        });
      }

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'completed',
          receiptNumber: callbackData?.TransactionReference || callbackData?.TransactionID || messageReference,
        },
      });

      // SMS: confirm the bank-funded top-up to the wallet owner
      if (transaction.type === 'credit') {
        await notifyBankTopupConfirmedForWallet(
          transaction.walletId,
          transaction.amount,
          callbackData?.TransactionReference || callbackData?.TransactionID || messageReference
        );
      }

      return { success: true, transactionId: transaction.id, status: 'completed' };
    } else {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'failed' },
      });
      return { success: false, transactionId: transaction.id, status: 'failed', error: String(status) };
    }
  } catch (error: any) {
    console.error('Bank funds-transfer callback error:', error);
    throw new Error(error.message || 'Failed to process bank callback');
  }
};

/**
 * Handle an incoming bank IPN (Instant Payment Notification).
 *
 * The bank notifies us whenever a credit or debit hits the company
 * account.  This function mirrors the M-Pesa C2B confirmation flow:
 * it de-duplicates by the bank TransactionId, tries to match an
 * existing pending transaction (e.g. a bank top-up initiated via
 * `initiateBankTopup`), and either completes that transaction or
 * creates a brand-new completed record — always using the same
 * `Transaction` model that M-Pesa uses.  The wallet balance is
 * adjusted atomically inside a Prisma transaction.
 */
export async function handleBankIPN(ipnData: any) {
  try {
    const {
      AcctNo,
      Amount,
      Currency,
      EventType,
      Narration,
      PaymentRef,
      TransactionId,
      TransactionDate,
      PostingDate,
      ValueDate,
      BookedBalance,
      ClearedBalance,
      CustMemoLine1,
      CustMemoLine2,
      CustMemoLine3,
      ExchangeRate,
    } = ipnData;

    const eventType = String(EventType || 'CREDIT').toUpperCase();
    const amount = parseFloat(String(Amount || '0'));
    const bankTransactionId = String(TransactionId || '').trim();

    if (!bankTransactionId) {
      return { success: false, error: 'TransactionId missing in IPN payload' };
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return { success: false, error: 'Invalid or zero amount' };
    }

    // ----------------------------------------------------------------
    // 1. De-duplicate – the bank may resend the same IPN multiple times
    // ----------------------------------------------------------------
    const existing = await prisma.transaction.findFirst({
      where: {
        OR: [
          { externalId: bankTransactionId },
          { reference: bankTransactionId },
          { receiptNumber: bankTransactionId },
        ],
      },
    });

    if (existing) {
      console.warn(`Bank IPN duplicate transaction ignored: ${bankTransactionId}`);
      return { success: true, message: 'Duplicate IPN ignored' };
    }

    // ----------------------------------------------------------------
    // 2. Parse the reference / channel from the narration & memo lines
    //    Narration:      "PESALINK~13a6212d6~ANTONY ODO ~560901~0042~100"
    //    CustMemoLine1:  "PESALINK~13a6212d6~ANTHONY"
    //    Segment 0 → channel, Segment 1 → reference, rest → sender info
    // ----------------------------------------------------------------
    const narrationStr = String(Narration || '');
    const memo1Str = String(CustMemoLine1 || '');
    const narrationParts = narrationStr.split('~').map((p) => p.trim()).filter(Boolean);
    const memo1Parts = memo1Str.split('~').map((p) => p.trim()).filter(Boolean);

    const channel = narrationParts[0] || memo1Parts[0] || '';
    const parsedReference = narrationParts[1] || memo1Parts[1] || '';
    const senderName =
      [memo1Parts[2], ...narrationParts.slice(2)].filter(Boolean).join(' ').trim() || '';

    // ----------------------------------------------------------------
    // 3. Try to match a pending transaction (e.g. a bank top-up)
    //    Strategy A: Match by parsed reference from narration
    //    Strategy B: Match by amount + sender account number (the
    //                accountReference stored by initiateBankTopup)
    //                for a recent pending BANK_TOPUP transaction.
    // ----------------------------------------------------------------
    let pendingTransaction: any = null;

    // 3a. Strategy A – direct reference match
    if (parsedReference) {
      pendingTransaction = await prisma.transaction.findFirst({
        where: {
          OR: [
            { externalId: parsedReference },
            { reference: parsedReference },
            { originatorConversationId: parsedReference },
          ],
          status: 'pending',
        },
        include: { wallet: true },
      });
    }

    const memo2Parts = String(CustMemoLine2 || '')
      .split('~').map((p) => p.trim()).filter(Boolean);

    const candidateAccounts = Array.from(new Set(
      [narrationParts[3], memo2Parts[1]]
        .map((s) => (s || '').trim())
        .filter(Boolean)
        .map((s) => s.replace(/\D/g, '')),
    )).filter(Boolean);

    const matchesCandidateAccount = (storedRaw: string | null | undefined): boolean => {
      const stored = String(storedRaw || '').replace(/\D/g, '');
      if (!stored || stored.length < 6) return false;
      return candidateAccounts.some(
        (c) => c.length >= 6 && (stored === c || stored.includes(c) || c.includes(stored)),
      );
    };

    // 3b. Strategy B – match by amount + sender account for pending top-ups
    if (pendingTransaction === null && candidateAccounts.length) {
      const recentPending = await prisma.transaction.findMany({
        where: {
          status: 'pending',
          amount,
          transactionType: 'BANK_TOPUP',
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { wallet: true },
      });

      pendingTransaction = recentPending.find(
        (t) => matchesCandidateAccount(t.accountReference),
      ) || null;
    }

    const isCredit = eventType === 'CREDIT';

    const ipnMetadata = {
      bankIPN: true,
      accountNo: AcctNo,
      currency: Currency,
      eventType,
      channel,
      parsedReference,
      senderName,
      paymentRef: PaymentRef,
      bankTransactionId,
      transactionDate: TransactionDate,
      postingDate: PostingDate,
      valueDate: ValueDate,
      bookedBalance: BookedBalance,
      clearedBalance: ClearedBalance,
      exchangeRate: ExchangeRate,
      custMemoLine1: CustMemoLine1,
      custMemoLine2: CustMemoLine2,
      custMemoLine3: CustMemoLine3,
      narration: Narration,
    };

    // ----------------------------------------------------------------
    // 4. Complete the matched pending transaction
    // ----------------------------------------------------------------
    if (pendingTransaction) {
      let existingMeta: any = {};
      try {
        existingMeta = pendingTransaction.metadata ? JSON.parse(pendingTransaction.metadata) : {};
      } catch {
        existingMeta = {};
      }

      const completedTx = await prisma.$transaction(async (tx) => {
        const updated = await tx.transaction.update({
          where: { id: pendingTransaction.id },
          data: {
            status: 'completed',
            receiptNumber: bankTransactionId,
            externalId: pendingTransaction.externalId || bankTransactionId,
            rawCallbackData: JSON.stringify(ipnData),
            callbackReceivedAt: new Date(),
            resultDesc: `Bank IPN: ${narrationStr}`,
            metadata: JSON.stringify({ ...existingMeta, ...ipnMetadata, matchedPendingTransaction: true }),
          },
        });

        // Use the transaction's own type to decide increment / decrement
        // (consistent with handleBankFundsTransferCallback)
        if (pendingTransaction.type === 'credit') {
          await tx.wallet.update({
            where: { id: pendingTransaction.walletId },
            data: { balance: { increment: pendingTransaction.amount } },
          });
        } else {
          await tx.wallet.update({
            where: { id: pendingTransaction.walletId },
            data: { balance: { decrement: pendingTransaction.amount } },
          });
        }

        return updated;
      });

      console.log(
        `Bank IPN: completed pending transaction ${completedTx.id} ` +
        `for wallet ${pendingTransaction.walletId} (${eventType} ${amount})`,
      );

      // SMS: confirm the bank top-up to the wallet owner
      if (pendingTransaction.type === 'credit') {
        await notifyBankTopupConfirmedForWallet(
          pendingTransaction.walletId,
          pendingTransaction.amount,
          bankTransactionId,
        );
      }

      return { success: true, transactionId: completedTx.id, status: 'completed', matched: 'pending' };
    }

    // ----------------------------------------------------------------
    // 4b. Suspected duplicate payment – same sender account and amount
    //     as a recently completed credit, but no pending top-up left to
    //     match. Hold it for manual review instead of crediting the
    //     wallet a second time.
    // ----------------------------------------------------------------
    if (isCredit && candidateAccounts.length) {
      const recentCompletedCredits = await prisma.transaction.findMany({
        where: {
          status: 'completed',
          type: 'credit',
          amount,
          transactionType: { in: ['BANK_TOPUP', 'BANK_IPN'] },
          callbackReceivedAt: { gte: new Date(Date.now() - BANK_IPN_DUPLICATE_WINDOW_MS) },
        },
        orderBy: { callbackReceivedAt: 'desc' },
        take: 50,
      });

      const duplicateOf = recentCompletedCredits.find(
        (t) => matchesCandidateAccount(t.accountReference),
      );

      if (duplicateOf) {
        const reviewTxn = await prisma.transaction.create({
          data: {
            walletId: duplicateOf.walletId,
            amount,
            type: 'credit',
            status: 'pending_review',
            reference: PaymentRef || bankTransactionId,
            receiptNumber: bankTransactionId,
            externalId: bankTransactionId,
            transactionType: 'BANK_IPN_DUPLICATE',
            accountReference: AcctNo,
            transactionDesc: narrationStr || `Bank ${eventType} via ${channel}`,
            remarks: channel || 'BANK_IPN_DUPLICATE',
            rawCallbackData: JSON.stringify(ipnData),
            callbackReceivedAt: new Date(),
            metadata: JSON.stringify({
              ...ipnMetadata,
              duplicateOfTransactionId: duplicateOf.id,
              reviewReason: 'duplicate_payment',
            }),
          },
        });

        console.warn(
          `Bank IPN: suspected duplicate payment held for review ` +
          `(txn ${reviewTxn.id}, original ${duplicateOf.id})`,
        );
        return {
          success: true,
          transactionId: reviewTxn.id,
          status: 'pending_review',
          matched: 'duplicate_review',
        };
      }
    }

    // ----------------------------------------------------------------
    // 5. No pending transaction – find a wallet and create a new record
    //    (mirrors the M-Pesa C2B confirmation flow)
    // ----------------------------------------------------------------
    let wallet: any = null;

    // a) Match the bank account number to a wallet by name
    if (AcctNo) {
      wallet = await prisma.wallet.findFirst({
        where: {
          OR: [
            { name: AcctNo },
            { name: { contains: AcctNo } },
          ],
        },
      });
    }

    // b) Fall back to the system "System Fees" wallet or any system wallet
    if (!wallet) {
      wallet = await prisma.wallet.findFirst({
        where: {
          OR: [
            { name: 'System Fees', contractorId: null },
            { contractorId: null },
          ],
        },
      });
    }

    if (!wallet) {
      console.warn(`Bank IPN: no wallet found for account ${AcctNo}`);
      return { success: false, error: 'Wallet not found for incoming bank payment' };
    }

    const newTransaction = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: isCredit ? 'credit' : 'debit',
          status: 'completed',
          reference: PaymentRef || bankTransactionId,
          receiptNumber: bankTransactionId,
          externalId: bankTransactionId,
          transactionType: 'BANK_IPN',
          accountReference: AcctNo,
          transactionDesc: narrationStr || `Bank ${eventType} via ${channel}`,
          remarks: channel || 'BANK_IPN',
          rawCallbackData: JSON.stringify(ipnData),
          callbackReceivedAt: new Date(),
          metadata: JSON.stringify(ipnMetadata),
        },
      });

      if (isCredit) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: amount } },
        });
      } else {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { decrement: amount } },
        });
      }

      return transaction;
    });

    console.log(
      `Bank IPN: created new transaction ${newTransaction.id} ` +
      `for wallet ${wallet.id} (${eventType} ${amount})`,
    );

    // SMS: confirm the credited wallet top-up to the wallet owner
    if (isCredit) {
      await notifyBankTopupConfirmedForWallet(wallet.id, amount, bankTransactionId);
    }

    return { success: true, transactionId: newTransaction.id, status: 'completed', matched: 'new' };
  } catch (error: any) {
    console.error('Bank IPN processing error:', error);
    throw new Error(error.message || 'Failed to process bank IPN');
  }
}

export const BankService = {
  getBankToken,
  validateBankAccount,
  sendPesalink,
  sendIFT,
  sendB2CMpesa,
  checkBankTransactionStatus,
  getAccountBalance,
  getMiniStatement,
  getFullStatement,
  initiateBankTopup,
  createBankPayout,
  executeBankPayout,
  handleBankFundsTransferCallback,
  handleBankIPN,
};