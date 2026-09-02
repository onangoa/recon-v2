import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperadmin } from '@/lib/require-permission';

export async function GET(request: NextRequest) {
  const adminCheck = await requireSuperadmin(request);
  if (!adminCheck.authorized) return adminCheck.error;
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const whereCondition = { status: 'pending_review' };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { wallet: true },
      }),
      prisma.transaction.count({ where: whereCondition }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('Failed to fetch pending review transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch pending review transactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const adminCheck = await requireSuperadmin(request);
  if (!adminCheck.authorized) return adminCheck.error;
  try {
    const body = await request.json();
    const { transactionIds, action, reason } = body;

    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json(
        { error: 'Transaction IDs are required' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'refund') {
      return NextResponse.json(
        { error: 'Invalid action. Use "approve" or "refund"' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const transactionId of transactionIds) {
      try {
        const transaction = await prisma.transaction.findUnique({
          where: { id: transactionId },
        });

        if (!transaction) {
          errors.push({ transactionId, error: 'Transaction not found' });
          continue;
        }

        if (transaction.status !== 'pending_review') {
          errors.push({ transactionId, error: 'Transaction is not pending review' });
          continue;
        }

        let existingMeta: any = {};
        try {
          existingMeta = transaction.metadata ? JSON.parse(transaction.metadata) : {};
        } catch {
          existingMeta = {};
        }

        const reviewMeta = JSON.stringify({
          ...existingMeta,
          reviewResolution: action,
          reviewedBy: adminCheck.userId,
          reviewedAt: new Date().toISOString(),
        });

        if (action === 'approve') {
          if (transaction.type !== 'credit') {
            errors.push({ transactionId, error: 'Only credit transactions can be approved' });
            continue;
          }

          await prisma.$transaction(async (tx) => {
            const { count } = await tx.transaction.updateMany({
              where: { id: transactionId, status: 'pending_review' },
              data: {
                status: 'completed',
                resultDesc: reason || 'Held payment approved by superadmin; wallet credited',
                metadata: reviewMeta,
              },
            });
            if (count === 0) {
              throw new Error('Transaction is no longer pending review');
            }
            await tx.wallet.update({
              where: { id: transaction.walletId },
              data: { balance: { increment: transaction.amount } },
            });
          });

          results.push({ transactionId, success: true, status: 'completed' });
        } else {
          const { count } = await prisma.transaction.updateMany({
            where: { id: transactionId, status: 'pending_review' },
            data: {
              status: 'refunded',
              resultDesc: reason || 'Held payment marked as refunded to sender',
              metadata: reviewMeta,
            },
          });

          if (count === 0) {
            errors.push({ transactionId, error: 'Transaction is no longer pending review' });
            continue;
          }

          results.push({ transactionId, success: true, status: 'refunded' });
        }
      } catch (error: any) {
        console.error(`Failed to review transaction ${transactionId}:`, error);
        errors.push({ transactionId, error: error.message });
      }
    }

    return NextResponse.json({
      processed: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (error: any) {
    console.error('Payment review error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process payment review' },
      { status: 500 }
    );
  }
}
