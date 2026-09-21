import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperadmin } from '@/lib/require-permission';
import {
  CREDIT_TYPES,
  DEBIT_TYPES,
  SETTLED_STATUSES,
  BALANCE_TOLERANCE,
} from '@/lib/transaction-ledger';

// All wallets (contractor and system) with each wallet's ledger reconciled
// against its stored balance, so superadmins can see at a glance which
// wallets balance and which have a discrepancy.
export async function GET(request: NextRequest) {
  const adminCheck = await requireSuperadmin(request);
  if (!adminCheck.authorized) return adminCheck.error;
  try {
    const [wallets, creditSums, debitSums] = await Promise.all([
      prisma.wallet.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          contractor: { select: { id: true, companyName: true } },
          _count: { select: { transactions: true } },
        },
      }),
      prisma.transaction.groupBy({
        by: ['walletId'],
        where: { type: { in: CREDIT_TYPES }, status: { in: SETTLED_STATUSES } },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ['walletId'],
        where: { type: { in: DEBIT_TYPES }, status: { in: SETTLED_STATUSES } },
        _sum: { amount: true },
      }),
    ]);

    const creditByWallet = new Map(creditSums.map((row) => [row.walletId, row._sum.amount ?? 0]));
    const debitByWallet = new Map(debitSums.map((row) => [row.walletId, row._sum.amount ?? 0]));

    const formattedWallets = wallets.map((wallet) => {
      const totalCredit = creditByWallet.get(wallet.id) ?? 0;
      const totalDebit = debitByWallet.get(wallet.id) ?? 0;
      const computedBalance = totalCredit - totalDebit;
      const variance = wallet.balance - computedBalance;
      return {
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
        totalCredit,
        totalDebit,
        computedBalance,
        variance,
        balanced: Math.abs(variance) < BALANCE_TOLERANCE,
      };
    });

    return NextResponse.json({
      wallets: formattedWallets,
      summary: {
        totalWallets: formattedWallets.length,
        balanced: formattedWallets.filter((w) => w.balanced).length,
        unbalanced: formattedWallets.filter((w) => !w.balanced).length,
      },
    });
  } catch (error) {
    console.error('Fetch superadmin wallets error:', error);
    return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 });
  }
}
