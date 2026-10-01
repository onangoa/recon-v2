import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequireContractorPermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';
import { buildWalletLedger } from '@/lib/transaction-ledger';

// Full per-wallet ledger for the contractor wallet trace view (scoped to the
// signed-in contractor's wallets): every bank, M-Pesa and internal
// transaction in chronological order with a running balance, plus a
// reconciliation of the ledger against the stored balance.
// Mobile mirror of /web/api/wallets/[id]/ledger.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'wallets:read');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const contractorId = permCheck.contractorId!;
    const resolvedParams = await params;
    const wallet = await prisma.wallet.findFirst({
      where: { id: resolvedParams.id, contractorId },
      include: { contractor: { select: { id: true, companyName: true } } },
    });
    if (!wallet) {
      return mobileError('Wallet not found', 404);
    }

    const transactions = await prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'asc' },
    });

    const { rows, summary } = buildWalletLedger(transactions, wallet.balance);

    return mobileSuccess({
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
      // Newest-first for the mobile ledger list (web reverses client-side).
      transactions: [...rows].reverse(),
      summary,
    });
  } catch (error) {
    console.error('Mobile fetch wallet ledger error:', error);
    return mobileError('Failed to fetch wallet ledger', 500);
  }
}
