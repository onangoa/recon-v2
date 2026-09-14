/**
 * Domain-specific SMS notifications built on the Celcom Africa gateway
 * (see lib/sms-service.ts). Every helper is best-effort: it never throws,
 * so a failed SMS can never break a payment flow.
 *
 * Implemented touchpoints (see sms.md):
 *  #1 Wallet top-up confirmed (M-Pesa STK callback / Co-op Bank IPN)
 *  #3 Payout approved / rejected (incl. payout destination + company)
 *  #5 Payout sent to recipient (incl. which company sent it)
 * Worker payroll payouts never send payout SMS (#3/#5 are skipped for
 * them — same markers as the payout-fee exemption).
 */
import { prisma } from './prisma';
import { sendSmsSafe, normalizeKenyanMobile } from './sms-service';
import { KENYAN_BANKS } from './bank-codes';
import { isPayrollPayout } from './payout-fee';

const formatKes = (amount: number) =>
  `KES ${new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(amount)}`;

/** 2547XXXXXXXX -> 07XXXXXXXX for display in messages. */
const displayPhone = (phone: string | number): string => {
  try {
    const normalized = normalizeKenyanMobile(phone);
    return `0${normalized.slice(3)}`;
  } catch {
    return String(phone);
  }
};

/** Long bank account numbers are masked to the last 4 digits. */
const maskAccount = (account?: string | null): string => {
  const digits = String(account || '').replace(/\s/g, '');
  if (!digits) return '';
  return digits.length <= 6 ? digits : `*${digits.slice(-4)}`;
};

const lookupBankName = (code?: string | null): string | undefined => {
  const normalized = String(code || '').replace(/\D/g, '').slice(-2);
  return KENYAN_BANKS.find((b) => b.code === normalized)?.name;
};

/**
 * Human-readable description of where a payout is sent, derived from the
 * transaction's payout channel (remarks / metadata.payoutChannel):
 * phone -> M-Pesa, pochi, paybill, till, or bank channels pesalink/ift/mpesa.
 */
function describePayoutDestination(transaction: {
  remarks?: string | null;
  phoneNumber?: string | null;
  accountReference?: string | null;
}, meta: Record<string, any>): string {
  const channel = meta.payoutChannel || transaction.remarks || 'phone';
  const phone = meta.mobileNumber || transaction.phoneNumber;
  const account = meta.destinationAccount || transaction.accountReference;

  switch (channel) {
    case 'pesalink': {
      const bankName = lookupBankName(meta.bankCode) || 'Bank';
      return `${bankName} A/C ${maskAccount(account)}`.trim();
    }
    case 'ift':
      return `Co-op Bank A/C ${maskAccount(account)}`.trim();
    case 'mpesa':
      return phone ? `M-Pesa ${displayPhone(phone)}` : 'M-Pesa';
    case 'pochi':
      return phone ? `Pochi la Biashara ${displayPhone(phone)}` : 'Pochi la Biashara';
    case 'paybill':
      return account ? `Paybill ${account}` : 'Paybill';
    case 'till':
      return account ? `Buy Goods Till ${account}` : 'Buy Goods Till';
    default:
      if (phone) return `M-Pesa ${displayPhone(phone)}`;
      if (account) return `A/C ${maskAccount(account)}`;
      return 'external account';
  }
}

async function deliver(
  phone: string | number | null | undefined,
  message: string
): Promise<boolean> {
  if (!phone) return false;
  const result = await sendSmsSafe(phone, message);
  if (!result.success) {
    const reason =
      result.error ||
      result.results
        .map((r) =>
          `${r.mobile} code=${r.code ?? 'n/a'} status=${r.status ?? 'n/a'} "${r.description ?? ''}"`.trim()
        )
        .join('; ');
    console.warn(`SMS not sent to ${phone}: ${reason}`);
  }
  return result.success;
}

/**
 * #1 — Confirm a completed wallet top-up to the payer.
 * Used by the M-Pesa STK Push callback where the payer's phone is known.
 */
export async function notifyWalletTopupConfirmed(
  phone: string | number | null | undefined,
  options: { amount: number; balance: number; receiptRef?: string | null }
): Promise<void> {
  try {
    const ref = options.receiptRef ? ` Ref ${options.receiptRef}.` : '';
    await deliver(phone, `Wallet top-up of ${formatKes(options.amount)} confirmed. New balance ${formatKes(options.balance)}.${ref}`);
  } catch (error) {
    console.error('Top-up confirmation SMS error:', error);
  }
}

/**
 * #1 — Bank-funded top-up variant. Resolves the wallet owner (contractor)
 * and their current balance, then confirms the top-up by SMS.
 */
export async function notifyBankTopupConfirmedForWallet(
  walletId: string,
  amount: number,
  receiptRef?: string | null
): Promise<void> {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
      include: { contractor: true },
    });
    if (!wallet?.contractor?.phoneNumber) return;
    await notifyWalletTopupConfirmed(wallet.contractor.phoneNumber, {
      amount,
      balance: wallet.balance,
      receiptRef,
    });
  } catch (error) {
    console.error('Bank top-up confirmation SMS error:', error);
  }
}

async function buildPayoutContext(transactionId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { wallet: { include: { contractor: true } } },
  });
  if (!transaction) return null;

  // Worker payroll payouts never send payout SMS (workers are notified by
  // the payment channel itself; the owner tracks payroll in the app)
  if (isPayrollPayout(transaction)) return null;

  let meta: Record<string, any> = {};
  try {
    meta = transaction.metadata ? JSON.parse(transaction.metadata) : {};
  } catch {
    meta = {};
  }

  return {
    company: transaction.wallet?.contractor?.companyName || null,
    phone: transaction.wallet?.contractor?.phoneNumber || null,
    amount: formatKes(transaction.amount),
    recipient: transaction.recipientName ? ` to ${transaction.recipientName}` : '',
    destination: describePayoutDestination(transaction, meta),
  };
}

/**
 * #3 — Tell the requester (wallet owner) that their payout was approved
 * and is being processed, including where the money is being sent.
 */
export async function notifyPayoutApproved(transactionId: string): Promise<void> {
  try {
    const ctx = await buildPayoutContext(transactionId);
    if (!ctx?.phone) return;
    const lead = ctx.company ? `${ctx.company} payout` : 'Payout';
    await deliver(
      ctx.phone,
      `${lead} of ${ctx.amount}${ctx.recipient} via ${ctx.destination} approved and processing.`
    );
  } catch (error) {
    console.error('Payout approval SMS error:', error);
  }
}

/**
 * #3 — Tell the requester (wallet owner) that their payout was rejected,
 * including where it was meant to go and why.
 */
export async function notifyPayoutRejected(
  transactionId: string,
  reason?: string | null
): Promise<void> {
  try {
    const ctx = await buildPayoutContext(transactionId);
    if (!ctx?.phone) return;
    const why = reason ? ` Reason: ${reason}.` : '';
    const lead = ctx.company ? `${ctx.company} payout` : 'Payout';
    await deliver(
      ctx.phone,
      `${lead} of ${ctx.amount}${ctx.recipient} via ${ctx.destination} was rejected.${why}`
    );
  } catch (error) {
    console.error('Payout rejection SMS error:', error);
  }
}

/**
 * Compact channel description for messages sent TO the payout recipient
 * (their own phone number is redundant, so only the channel is named).
 */
function describePayoutChannelForRecipient(transaction: {
  remarks?: string | null;
  accountReference?: string | null;
}, meta: Record<string, any>): string {
  const channel = meta.payoutChannel || transaction.remarks || 'phone';
  const account = meta.destinationAccount || transaction.accountReference;

  switch (channel) {
    case 'pesalink':
      return `${lookupBankName(meta.bankCode) || 'Bank'} A/C ${maskAccount(account)}`.trim();
    case 'ift':
      return `Co-op Bank A/C ${maskAccount(account)}`.trim();
    case 'pochi':
      return 'Pochi la Biashara';
    case 'paybill':
      return account ? `Paybill ${account}` : 'Paybill';
    case 'till':
      return account ? `Buy Goods Till ${account}` : 'Buy Goods Till';
    default:
      return 'M-Pesa';
  }
}

/**
 * #5 — Tell the payout recipient that the money has been sent to them,
 * including which company it is from. Sent when a payout completes
 * (M-Pesa B2C/B2B/Pochi callbacks, bank transfer callbacks, or manual
 * immediate payouts) — only when the destination phone is known.
 */
export async function notifyPayoutSentToRecipient(transactionId: string): Promise<void> {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { wallet: { include: { contractor: true } } },
    });
    if (!transaction) return;

    // Worker payroll payouts never send payment SMS to the recipient
    if (isPayrollPayout(transaction)) return;

    let meta: Record<string, any> = {};
    try {
      meta = transaction.metadata ? JSON.parse(transaction.metadata) : {};
    } catch {
      meta = {};
    }

    const company = transaction.wallet?.contractor?.companyName;
    const phone = meta.mobileNumber || transaction.phoneNumber;
    if (!company || !phone) return;

    const channel = describePayoutChannelForRecipient(transaction, meta);
    const ref = transaction.mpesaReceiptNumber
      ? ` Ref ${transaction.mpesaReceiptNumber}.`
      : '';
    await deliver(
      phone,
      `${company} has sent you ${formatKes(transaction.amount)} via ${channel}.${ref}`
    );
  } catch (error) {
    console.error('Payout sent SMS error:', error);
  }
}
