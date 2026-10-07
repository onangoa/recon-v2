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

// ---------------------------------------------------------------------------
// Ledger building (shared by the superadmin and contractor wallet-ledger
// APIs, so both sides always reconcile identically)
// ---------------------------------------------------------------------------

export interface LedgerSourceTransaction {
  id: string;
  seq: number;
  type: string;
  status: string;
  amount: number;
  description: string | null;
  transactionDesc: string | null;
  reference: string | null;
  receiptNumber: string | null;
  mpesaReceiptNumber: string | null;
  mpesaTransactionId: string | null;
  transactionType: string | null;
  accountReference: string | null;
  phoneNumber: string | null;
  remarks: string | null;
  recipientName: string | null;
  createdAt: Date;
}

export interface LedgerRow {
  id: string;
  seq: number;
  type: string;
  status: string;
  channel: LedgerChannel;
  direction: LedgerDirection | null;
  settled: boolean;
  amount: number;
  description: string | null;
  transactionDesc: string | null;
  reference: string | null;
  receiptNumber: string | null;
  mpesaReceiptNumber: string | null;
  mpesaTransactionId: string | null;
  transactionType: string | null;
  accountReference: string | null;
  phoneNumber: string | null;
  remarks: string | null;
  recipientName: string | null;
  createdAt: Date;
  balanceAfter: number;
}

export interface ChannelTotals {
  credit: number;
  debit: number;
  creditCount: number;
  debitCount: number;
}

export interface LedgerSummary {
  storedBalance: number;
  totalCredit: number;
  totalDebit: number;
  computedBalance: number;
  variance: number;
  balanced: boolean;
  transactionCount: number;
  settledCount: number;
  pendingCount: number;
  byChannel: Record<string, ChannelTotals>;
  statusCounts: Record<string, number>;
}

/**
 * Walk a wallet's transactions chronologically, attaching direction, channel
 * and the running balance after every settled (balance-affecting) row, and
 * reconcile the computed ledger total against the stored wallet balance.
 * `transactions` must be ordered oldest-first.
 */
export function buildWalletLedger(
  transactions: LedgerSourceTransaction[],
  storedBalance: number
): { rows: LedgerRow[]; summary: LedgerSummary } {
  let runningBalance = 0;
  const rows: LedgerRow[] = transactions.map((tx) => {
    const direction = getDirection(tx);
    const settled = direction !== null && isSettled(tx.status);
    if (settled && direction) {
      runningBalance += direction === 'credit' ? tx.amount : -tx.amount;
    }
    return {
      id: tx.id,
      seq: tx.seq,
      type: tx.type,
      status: tx.status,
      channel: getChannel(tx),
      direction,
      settled,
      amount: tx.amount,
      description: tx.description,
      transactionDesc: tx.transactionDesc,
      reference: tx.reference,
      receiptNumber: tx.receiptNumber,
      mpesaReceiptNumber: tx.mpesaReceiptNumber,
      mpesaTransactionId: tx.mpesaTransactionId,
      transactionType: tx.transactionType,
      accountReference: tx.accountReference,
      phoneNumber: tx.phoneNumber,
      remarks: tx.remarks,
      recipientName: tx.recipientName,
      createdAt: tx.createdAt,
      balanceAfter: runningBalance,
    };
  });

  const settledRows = rows.filter((tx) => tx.settled);
  const totalCredit = settledRows
    .filter((tx) => tx.direction === 'credit')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalDebit = settledRows
    .filter((tx) => tx.direction === 'debit')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const byChannel: Record<string, ChannelTotals> = {
    mpesa: { credit: 0, debit: 0, creditCount: 0, debitCount: 0 },
    bank: { credit: 0, debit: 0, creditCount: 0, debitCount: 0 },
    internal: { credit: 0, debit: 0, creditCount: 0, debitCount: 0 },
  };
  for (const tx of settledRows) {
    const bucket = byChannel[tx.channel];
    if (tx.direction === 'credit') {
      bucket.credit += tx.amount;
      bucket.creditCount += 1;
    } else {
      bucket.debit += tx.amount;
      bucket.debitCount += 1;
    }
  }

  const statusCounts: Record<string, number> = {};
  for (const tx of rows) {
    statusCounts[tx.status] = (statusCounts[tx.status] ?? 0) + 1;
  }

  const computedBalance = totalCredit - totalDebit;
  const variance = storedBalance - computedBalance;

  return {
    rows,
    summary: {
      storedBalance,
      totalCredit,
      totalDebit,
      computedBalance,
      variance,
      balanced: Math.abs(variance) < BALANCE_TOLERANCE,
      transactionCount: rows.length,
      settledCount: settledRows.length,
      pendingCount: rows.length - settledRows.length,
      byChannel,
      statusCounts,
    },
  };
}

export function sumsByWallet(
  rows: Array<{ walletId: string; _sum: { amount: number | null } }>
): Map<string, number> {
  return new Map(rows.map((row) => [row.walletId, row._sum.amount ?? 0]));
}

export interface WalletReconciliation {
  id: string;
  name: string;
  description: string | null;
  balance: number;
  currency: string;
  status: string;
  contractor: { id: string; companyName: string } | null;
  transactionCount: number;
  totalCredit: number;
  totalDebit: number;
  computedBalance: number;
  variance: number;
  balanced: boolean;
}

export function formatWalletReconciliation(
  wallet: {
    id: string;
    name: string;
    description: string | null;
    balance: number;
    currency: string;
    status: string;
    contractor: { id: string; companyName: string } | null;
    transactionCount: number;
  },
  totalCredit: number,
  totalDebit: number
): WalletReconciliation {
  const computedBalance = totalCredit - totalDebit;
  const variance = wallet.balance - computedBalance;
  return {
    ...wallet,
    totalCredit,
    totalDebit,
    computedBalance,
    variance,
    balanced: Math.abs(variance) < BALANCE_TOLERANCE,
  };
}
