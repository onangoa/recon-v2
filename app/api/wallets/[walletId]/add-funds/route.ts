import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ walletId: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { walletId } = await params;

  const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
  if (!wallet) return mobileError('Wallet not found', 404);

  const body = await request.json();
  const amount = parseFloat(body.amount);
  if (!amount || amount <= 0) return mobileError('Invalid amount', 400);

  const transaction = await prisma.transaction.create({
    data: {
      walletId,
      amount,
      type: 'deposit',
      description: body.description || 'Wallet top-up',
      status: 'completed',
      reference: body.reference || `DEP-${Date.now()}`,
    },
  });

  await prisma.wallet.update({
    where: { id: walletId },
    data: { balance: { increment: amount } },
  });

  return mobileSuccess({
    id: transaction.id,
    amount: transaction.amount,
    type: transaction.type,
    status: transaction.status,
    reference: transaction.reference,
    created_at: transaction.createdAt,
  }, 'Funds added successfully');
}