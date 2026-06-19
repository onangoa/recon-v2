import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ walletId: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { walletId } = await params;

  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
    include: { transactions: { orderBy: { createdAt: 'desc' }, take: 10 } },
  });
  if (!wallet) return mobileError('Wallet not found', 404);

  return mobileSuccess({
    id: wallet.id,
    name: wallet.name,
    description: wallet.description,
    balance: wallet.balance,
    currency: wallet.currency,
    status: wallet.status,
    created_at: wallet.createdAt,
    updated_at: wallet.updatedAt,
    transactions: wallet.transactions.map(t => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      description: t.description,
      status: t.status,
      reference: t.reference,
      created_at: t.createdAt,
    })),
  });
}