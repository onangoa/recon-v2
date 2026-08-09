import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  const permCheck = await mobileRequirePermission(request, 'wallets:read');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    if (!permCheck.contractorId) {
      return mobileError('Contractor not found', 404);
    }

    const wallets = await prisma.wallet.findMany({
      where: { contractorId: permCheck.contractorId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { transactions: true },
        },
        transactions: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const formattedWallets = wallets.map(wallet => ({
      ...wallet,
      lastTransaction: wallet.transactions.length > 0
        ? getTimeAgo(new Date(wallet.transactions[0].createdAt))
        : 'No transactions',
      transactionCount: wallet._count.transactions,
    }));

    return mobileSuccess(formattedWallets);
  } catch (error) {
    console.error('Mobile fetch wallets error:', error);
    return mobileError('Failed to fetch wallets', 500);
  }
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }

  return 'Just now';
}

export async function POST(request: NextRequest) {
  const permCheck = await mobileRequirePermission(request, 'wallets:create');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    if (!permCheck.contractorId) {
      return mobileError('Contractor not found', 404);
    }

    const body = await request.json();

    if (!body.name) {
      return mobileError('Wallet name is required', 400);
    }

    const wallet = await prisma.wallet.create({
      data: {
        name: body.name,
        description: body.description || null,
        supportedPaymentOptions: Array.isArray(body.supportedPaymentOptions)
          ? body.supportedPaymentOptions.join(',')
          : (body.supportedPaymentOptions || null),
        dailySpendLimit: body.dailySpendLimit != null ? Number(body.dailySpendLimit) : null,
        contractorId: permCheck.contractorId,
      },
    });

    return mobileSuccess(wallet, 'Wallet created');
  } catch (error) {
    console.error('Mobile create wallet error:', error);
    return mobileError('Failed to create wallet', 500);
  }
}
