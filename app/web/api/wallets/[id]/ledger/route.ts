import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';
import { buildWalletLedger } from '@/lib/transaction-ledger';

// Full per-wallet ledger for the contractor wallet trace view (scoped to the
// signed-in contractor's wallets): every bank, M-Pesa and internal
// transaction in chronological order with a running balance, plus a
// reconciliation of the ledger against the stored balance.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requirePermission(request, 'wallets:read');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const contractorId = permCheck.contractorId;
    if (!contractorId) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    const resolvedParams = await params;
    const wallet = await prisma.wallet.findFirst({
      where: { id: resolvedParams.id, contractorId },
      include: { contractor: { select: { id: true, companyName: true } } },
    });
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const transactions = await prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'asc' },
    });

    const { rows, summary } = buildWalletLedger(transactions, wallet.balance);

    return NextResponse.json({
      wallet: {
        id: wallet.id,
        name: wallet.name,
        description: wallet.description,
        balance: wallet.balance,
        currency: wallet.currency,
        status: wallet.status,
        contractor: wallet.contractor
          ? { id: wallet.contractor.id, companyName: wallet.contractor.companyName }
          : null,
      },
      transactions: [...rows].reverse(),
      summary,
    });
  } catch (error) {
    console.error('Fetch contractor wallet ledger error:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet transactions' }, { status: 500 });
  }
}
