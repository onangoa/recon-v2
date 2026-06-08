import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        wallet: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { walletId, amount, type, description, referenceNumber, status } = body;

    // Create transaction and update wallet balance
    const transaction = await prisma.$transaction(async (tx) => {
      const newTx = await tx.transaction.create({
        data: {
          walletId,
          amount: parseFloat(amount),
          type,
          description,
          referenceNumber,
          status: status || 'completed',
        },
      });

      if (status === 'completed' || !status) {
        await tx.wallet.update({
          where: { id: walletId },
          data: {
            balance: {
              increment: type === 'credit' ? parseFloat(amount) : -parseFloat(amount),
            },
          },
        });
      }

      return newTx;
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
