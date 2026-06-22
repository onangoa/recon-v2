import { NextRequest, NextResponse } from 'next/server';
import {
  getWalletTransactions,
  TransactionStatus,
  TransactionType
} from '@/lib/mpesa-service';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';

export async function GET(req: NextRequest) {
  const permCheck = await requirePermission(req, 'wallets:read');
  if (!permCheck.authorized) return permCheck.error;
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
      return NextResponse.json({
        success: false,
        error: 'Contractor account required'
      }, { status: 403 });
    }

    const contractorWallets = await prisma.wallet.findMany({
      where: { contractorId },
      select: { id: true }
    });
    const walletIdList = contractorWallets.map(w => w.id);

    // Get single transaction by ID
    if (transactionId) {
      const transaction = await prisma.transaction.findFirst({
        where: { id: transactionId, wallet: { contractorId } },
        include: { wallet: true }
      });

      if (!transaction) {
        return NextResponse.json({
          success: false,
          error: 'Transaction not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: transaction
      });
    }

    // Get transactions by wallet
    if (walletId) {
      // Validate wallet exists
      const wallet = await prisma.wallet.findFirst({
        where: { id: walletId, contractorId }
      });

      if (!wallet) {
        return NextResponse.json({
          success: false,
          error: 'Wallet not found'
        }, { status: 404 });
      }

      const result = await getWalletTransactions(walletId, limit, offset);

      return NextResponse.json({
        success: true,
        data: {
          transactions: result.transactions,
          pagination: {
            total: result.total,
            page: result.page,
            totalPages: result.totalPages,
            limit: limit,
            offset: offset
          }
        }
      });
    }

    // Get transactions by status
    if (status) {
      // Validate status
      if (!Object.values(TransactionStatus).includes(status as TransactionStatus)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid status value'
        }, { status: 400 });
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

      return NextResponse.json({
        success: true,
        data: {
          transactions,
          pagination: {
            total,
            page: Math.floor(offset / limit) + 1,
            totalPages: Math.ceil(total / limit),
            limit,
            offset
          }
        }
      });
    }

    // Get transactions by type
    if (type) {
      // Validate type
      if (!Object.values(TransactionType).includes(type as TransactionType)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid transaction type'
        }, { status: 400 });
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

      return NextResponse.json({
        success: true,
        data: {
          transactions,
          pagination: {
            total,
            page: Math.floor(offset / limit) + 1,
            totalPages: Math.ceil(total / limit),
            limit,
            offset
          }
        }
      });
    }

    // Get all transactions for this contractor's wallets
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

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(total / limit),
          limit,
          offset
        }
      }
    });

  } catch (error: any) {
    console.error('Get transactions error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve transactions',
      details: error.message
    }, { status: 500 });
  }
}