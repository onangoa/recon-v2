import { NextRequest, NextResponse } from 'next/server';
import { 
  getTransaction, 
  getWalletTransactions, 
  getTransactionsByStatus,
  getTransactionsByType,
  TransactionStatus,
  TransactionType 
} from '@/lib/mpesa-service';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';

export async function GET(req: NextRequest) {
  const permCheck = await requirePermission(req, 'wallets:read');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get('transactionId');
    const walletId = searchParams.get('walletId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get single transaction by ID
    if (transactionId) {
      const transaction = await getTransaction(transactionId);

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
      const wallet = await prisma.wallet.findUnique({
        where: { id: walletId }
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

      const result = await getTransactionsByStatus(status, limit, offset);

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

    // Get transactions by type
    if (type) {
      // Validate type
      if (!Object.values(TransactionType).includes(type as TransactionType)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid transaction type'
        }, { status: 400 });
      }

      const result = await getTransactionsByType(type, limit, offset);

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

    // Get all transactions with pagination
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          wallet: true
        }
      }),
      prisma.transaction.count()
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