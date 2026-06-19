import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';

export async function GET(request: NextRequest) {
  const permCheck = await requirePermission(request, 'wallets:read');
  if (!permCheck.authorized) return permCheck.error;
  try {
    if (!permCheck.contractorId) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
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

    return NextResponse.json(formattedWallets);
  } catch (error) {
    console.error('Failed to fetch wallets:', error);
    return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 });
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
  const permCheck = await requirePermission(request, 'wallets:create');
  if (!permCheck.authorized) return permCheck.error;
  try {
    if (!permCheck.contractorId) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: 'Wallet name is required' }, { status: 400 });
    }

    const wallet = await prisma.wallet.create({
      data: {
        name: body.name,
        description: body.description || null,
        contractorId: permCheck.contractorId,
      },
    });

    return NextResponse.json(wallet, { status: 201 });
  } catch (error) {
    console.error('Failed to create wallet:', error);
    return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 });
  }
}