import { prisma } from './prisma';

// Flat transaction fee charged on outgoing wallet payouts (bank transfers,
// M-Pesa payouts and manual payouts). Payroll disbursements are exempt.
// The amount lives in PlatformConfig so it can be changed at any time
// without a deploy; DEFAULT_PAYOUT_FEE is only the initial fallback.

export const PAYOUT_FEE_KEY = 'payoutFee';
export const DEFAULT_PAYOUT_FEE = 40;

/**
 * Current payout fee in KES. Falls back to DEFAULT_PAYOUT_FEE when the
 * config row is missing or holds an invalid value.
 */
export async function getPayoutFee(): Promise<number> {
  try {
    const config = await prisma.platformConfig.findUnique({
      where: { key: PAYOUT_FEE_KEY },
    });
    const value = config ? Number.parseFloat(config.value) : NaN;
    return Number.isFinite(value) && value >= 0 ? value : DEFAULT_PAYOUT_FEE;
  } catch {
    return DEFAULT_PAYOUT_FEE;
  }
}

/**
 * True when the transaction is a worker payroll disbursement
 * (payroll payouts are exempt from the fee).
 */
export function isPayrollPayout(tx: {
  reference?: string | null;
  metadata?: string | null;
  description?: string | null;
}): boolean {
  if (tx.reference?.startsWith('PAYROLL-')) return true;
  if (tx.description?.startsWith('Payroll:')) return true;
  try {
    const meta = tx.metadata ? JSON.parse(tx.metadata) : null;
    if (meta && (meta.category === 'payroll' || meta.isPayroll === true)) return true;
  } catch {
    // ignore malformed metadata
  }
  return false;
}

/**
 * Charge the flat payout fee against the payout's wallet. Idempotent:
 * replayed callbacks or retries never charge twice. Returns the fee
 * charged (0 when exempt or already charged).
 */
export async function chargePayoutFee(payout: {
  id: string;
  walletId: string;
  reference?: string | null;
  metadata?: string | null;
  description?: string | null;
}): Promise<number> {
  if (isPayrollPayout(payout)) return 0;

  const feeReference = `FEE-${payout.id}`;
  const existing = await prisma.transaction.findFirst({
    where: { reference: feeReference, transactionType: 'PAYOUT_FEE' },
    select: { id: true },
  });
  if (existing) return 0;

  const fee = await getPayoutFee();
  if (!fee || fee <= 0) return 0;

  await prisma.$transaction([
    prisma.transaction.create({
      data: {
        walletId: payout.walletId,
        type: 'debit',
        amount: fee,
        status: 'completed',
        transactionType: 'PAYOUT_FEE',
        description: `Payout fee (${payout.reference || payout.description || payout.id})`,
        reference: feeReference,
        metadata: JSON.stringify({ payoutTransactionId: payout.id }),
      },
    }),
    prisma.wallet.update({
      where: { id: payout.walletId },
      data: { balance: { decrement: fee } },
    }),
  ]);

  return fee;
}

/**
 * Refund a previously charged payout fee (used when a payout is reversed).
 * Returns the refunded amount (0 when no fee was charged).
 */
export async function refundPayoutFee(payoutTransactionId: string): Promise<number> {
  const feeTx = await prisma.transaction.findFirst({
    where: {
      reference: `FEE-${payoutTransactionId}`,
      transactionType: 'PAYOUT_FEE',
      status: 'completed',
    },
  });
  if (!feeTx) return 0;

  await prisma.$transaction([
    prisma.transaction.update({
      where: { id: feeTx.id },
      data: { status: 'refunded', description: `${feeTx.description} (refunded)` },
    }),
    prisma.wallet.update({
      where: { id: feeTx.walletId },
      data: { balance: { increment: feeTx.amount } },
    }),
  ]);

  return feeTx.amount;
}
