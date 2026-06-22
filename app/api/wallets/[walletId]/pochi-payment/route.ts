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

  if (wallet.balance < amount) return Response.json({ success: false, message: 'Insufficient balance' }, { status: 400 });

  try {
    const transaction = await prisma.transaction.create({
      data: {
        walletId,
        amount: -amount,
        type: 'pochi',
        description: body.description || 'Pochi la Biashara payment',
        status: 'pending',
        reference: `POCHI-${Date.now()}`,
        phoneNumber: body.phone || body.phone_number,
        transactionType: 'pochi',
        remarks: body.remarks || null,
      },
    });

    return Response.json({
      success: true,
      message: 'Phone payment initiated successfully',
      data: {
        transaction_id: transaction.id,
        conversation_id: null,
        originator_conversation_id: null,
      },
    });
  } catch {
    return Response.json({ success: false, message: 'Failed to initiate phone payment. Please try again.' }, { status: 500 });
  }
}