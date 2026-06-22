import { NextRequest } from 'next/server';
import { mobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ walletId: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const { walletId } = await params;

  const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
  if (!wallet) return Response.json({ success: false, message: 'Wallet not found' }, { status: 404 });

  const body = await request.json();
  const amount = parseFloat(body.amount);
  if (!amount || amount <= 0) return Response.json({ success: false, message: 'Invalid amount' }, { status: 400 });

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

  return Response.json({
    success: true,
    message: 'Payment initiated successfully. Please complete the payment on your phone.',
    data: {
      transaction_id: transaction.id,
      checkout_request_id: transaction.reference,
    },
  });
}