import { NextRequest } from 'next/server';
import {
  getWalletTransactions,
  TransactionStatus,
  TransactionType
} from '@/lib/mpesa-service';
import { prisma } from '@/lib/prisma';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
  mobileList,
} from '@/lib/mobile-auth';

export async function GET(req: NextRequest) {
  const permCheck = await mobileRequirePermission(req, 'wallets:read');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId;
  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get('transactionId');
    const walletId = searchParams.get('walletId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!contractorId) {
      return mobileError('Contractor account required', 403);
    }

    const contractorWallets = await prisma.wallet.findMany({
      where: { contractorId },
      select: { id: true }
    });
    const walletIdList = contractorWallets.map(w => w.id);

    if (transactionId) {
      const transaction = await prisma.transaction.findFirst({
        where: { id: transactionId, wallet: { contractorId } },
        include: { wallet: true }
      });

      if (!transaction) {
        return mobileError('Transaction not found', 404);
      }

      return mobileSuccess(transaction);
    }

    if (walletId) {
      const wallet = await prisma.wallet.findFirst({
        where: { id: walletId, contractorId }
      });

      if (!wallet) {
        return mobileError('Wallet not found', 404);
      }

      const result = await getWalletTransactions(walletId, limit, offset);

      return mobileList(result.transactions, result.total, {
        page: result.page,
        limit,
        pages: result.totalPages,
      });
    }

    if (status) {
      if (!Object.values(TransactionStatus).includes(status as TransactionStatus)) {
        return mobileError('Invalid status value', 400);
      }

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where: { status, walletId: { in: walletIdList } },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          include: { wallet: true }
        }),
        prisma.transaction.count({ where: { status, walletId: { in: walletIdList } } })
      ]);

      return mobileList(transactions, total, {
        page: Math.floor(offset / limit) + 1,
        limit,
        pages: Math.ceil(total / limit),
      });
    }

    if (type) {
      if (!Object.values(TransactionType).includes(type as TransactionType)) {
        return mobileError('Invalid transaction type', 400);
      }

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where: { type, walletId: { in: walletIdList } },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          include: { wallet: true }
        }),
        prisma.transaction.count({ where: { type, walletId: { in: walletIdList } } })
      ]);

      return mobileList(transactions, total, {
        page: Math.floor(offset / limit) + 1,
        limit,
        pages: Math.ceil(total / limit),
      });
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { walletId: { in: walletIdList } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          wallet: true
        }
      }),
      prisma.transaction.count({ where: { walletId: { in: walletIdList } } })
    ]);

    return mobileList(transactions, total, {
      page: Math.floor(offset / limit) + 1,
      limit,
      pages: Math.ceil(total / limit),
    });

  } catch (error: any) {
    console.error('Mobile get transactions error:', error);
    return mobileError('Failed to retrieve transactions', 500);
  }
}
