import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';
import {
  CREDIT_TYPES,
  DEBIT_TYPES,
  SETTLED_STATUSES,
  sumsByWallet,
  formatWalletReconciliation,
} from '@/lib/transaction-ledger';

// The signed-in contractor's wallets with each wallet's ledger reconciled
// against its stored balance (contractor-scoped mirror of the superadmin
// wallets reconciliation endpoint).
export async function GET(request: NextRequest) {
  const permCheck = await requirePermission(request, 'wallets:read');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const contractorId = permCheck.contractorId;
    if (!contractorId) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    const [wallets, creditSums, debitSums] = await Promise.all([
      prisma.wallet.findMany({
        where: { contractorId },
        orderBy: { createdAt: 'desc' },
        include: {
          contractor: { select: { id: true, companyName: true } },
          _count: { select: { transactions: true } },
        },
      }),
      prisma.transaction.groupBy({
        by: ['walletId'],
        where: {
          type: { in: CREDIT_TYPES },
          status: { in: SETTLED_STATUSES },
          wallet: { contractorId },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ['walletId'],
        where: {
          type: { in: DEBIT_TYPES },
          status: { in: SETTLED_STATUSES },
          wallet: { contractorId },
        },
        _sum: { amount: true },
      }),
    ]);

    const creditByWallet = sumsByWallet(creditSums);
    const debitByWallet = sumsByWallet(debitSums);

    const formattedWallets = wallets.map((wallet) =>
      formatWalletReconciliation(
        {
          id: wallet.id,
          name: wallet.name,
          description: wallet.description,
          balance: wallet.balance,
          currency: wallet.currency,
          status: wallet.status,
          contractor: wallet.contractor
            ? { id: wallet.contractor.id, companyName: wallet.contractor.companyName }
            : null,
          transactionCount: wallet._count.transactions,
        },
        creditByWallet.get(wallet.id) ?? 0,
        debitByWallet.get(wallet.id) ?? 0
      )
    );

    return NextResponse.json({
      wallets: formattedWallets,
      summary: {
        totalWallets: formattedWallets.length,
        balanced: formattedWallets.filter((w) => w.balanced).length,
        unbalanced: formattedWallets.filter((w) => !w.balanced).length,
      },
    });
  } catch (error) {
    console.error('Fetch contractor wallet reconciliation error:', error);
    return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 });
  }
}
