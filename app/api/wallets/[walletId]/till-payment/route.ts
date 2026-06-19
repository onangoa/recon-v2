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

  if (wallet.balance < amount) return mobileError('Insufficient balance', 400);

  const transaction = await prisma.transaction.create({
    data: {
      walletId,
      amount: -amount,
      type: 'b2b_till',
      description: body.description || 'Till payment',
      status: 'pending',
      reference: `TILL-${Date.now()}`,
      phoneNumber: body.till_number || null,
      transactionType: 'b2b_till',
      accountReference: body.account_reference || null,
      remarks: body.remarks || null,
    },
  });

  return mobileSuccess({
    id: transaction.id,
    amount: Math.abs(transaction.amount),
    type: transaction.type,
    status: transaction.status,
    reference: transaction.reference,
    till_number: transaction.phoneNumber,
    created_at: transaction.createdAt,
  }, 'Till payment initiated');
}