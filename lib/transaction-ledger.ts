// Ledger classification helpers shared by the superadmin wallet
// reconciliation views. The unified Transaction table is written by manual,
// bank (Co-op OpenAPI) and M-Pesa flows, each with its own `type`/`status`
// conventions, so direction, channel and settled state must be normalised
// before a wallet ledger can be reconciled against the stored balance.

export type LedgerDirection = 'credit' | 'debit';
export type LedgerChannel = 'mpesa' | 'bank' | 'internal';

// `type` values that move money INTO a wallet. STK_PUSH and C2B are M-Pesa
// top-ups written with their product enum instead of 'credit', and REVERSAL
// rows return a previously paid-out amount to the wallet.
export const CREDIT_TYPES = ['credit', 'STK_PUSH', 'C2B', 'REVERSAL'];

// `type` values that move money OUT of a wallet (B2C/B2B/B2POCHI are M-Pesa
// payout products written with their enum instead of 'debit').
export const DEBIT_TYPES = ['debit', 'B2C', 'B2B', 'B2POCHI'];

// Statuses that have already been applied to the stored wallet balance.
// Bank and manual flows write lowercase, M-Pesa callbacks write uppercase.
export const SETTLED_STATUSES = ['completed', 'SUCCESS'];

export const BALANCE_TOLERANCE = 0.01;

export interface LedgerTransactionSource {
  type: string;
  status: string;
  transactionType?: string | null;
  mpesaTransactionId?: string | null;
  mpesaReceiptNumber?: string | null;
}

export function getDirection(tx: Pick<LedgerTransactionSource, 'type'>): LedgerDirection | null {
  if (CREDIT_TYPES.includes(tx.type)) return 'credit';
  if (DEBIT_TYPES.includes(tx.type)) return 'debit';
  return null;
}

export function isSettled(status: string): boolean {
  return SETTLED_STATUSES.includes(status);
}

export function getChannel(tx: LedgerTransactionSource): LedgerChannel {
  // Bank rails first: BANK_MPESA payouts travel on the bank API even though
  // the destination is an M-Pesa account.
  if (tx.transactionType?.startsWith('BANK_')) return 'bank';
  if (
    tx.mpesaTransactionId ||
    tx.mpesaReceiptNumber ||
    (tx.transactionType && ['STK_PUSH', 'B2C', 'B2B', 'B2POCHI', 'C2B', 'REVERSAL'].includes(tx.transactionType))
  ) {
    return 'mpesa';
  }
  return 'internal';
}
