import { prisma } from './prisma';

// ============ Co-op Bank OpenAPI Configuration ============
const COOP_BASE_URL = process.env.COOP_BANK_BASE_URL || 'https://openapi.co-opbank.co.ke';
const AUTH_TOKEN = process.env.COOP_BANK_AUTH_TOKEN || '';
const DEFAULT_USER_ID = process.env.COOP_BANK_USER_ID || 'RECON';
const DEFAULT_SOURCE_ACCOUNT = process.env.COOP_BANK_SOURCE_ACCOUNT || '';
const FUNDS_TRANSFER_CALLBACK = process.env.COOP_BANK_CALLBACK_URL || 'https://yourdomain.com/web/api/callbacks/bank/funds-transfer';

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

  const result = await bankPost('/FundsTransfer/External/PesaLinkBulk_v1/1.0.0/', payload);
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
};