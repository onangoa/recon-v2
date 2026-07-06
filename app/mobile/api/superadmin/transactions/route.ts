import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequireSuperadmin,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  const permCheck = await mobileRequireSuperadmin(request);
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        wallet: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return mobileSuccess(transactions);
  } catch (error) {
    return mobileError('Failed to fetch transactions', 500);
  }
}

export async function POST(request: NextRequest) {
  const permCheck = await mobileRequireSuperadmin(request);
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const body = await request.json();
    const { walletId, amount, type, description, referenceNumber, status } = body;

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

    return mobileSuccess(transaction, 'Transaction created');
  } catch (error) {
    console.error('Create transaction error:', error);
    return mobileError('Failed to create transaction', 500);
  }
}
