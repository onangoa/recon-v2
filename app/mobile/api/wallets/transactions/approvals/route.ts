import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { initiateB2C, initiateB2B, initiateB2Pochi } from '@/lib/mpesa';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
  mobileList,
} from '@/lib/mobile-auth';
import { notifyPayoutApproved, notifyPayoutRejected } from '@/lib/sms-notifications';

export async function GET(
  request: NextRequest
) {
  const permCheck = await mobileRequirePermission(request, 'wallets:read');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get('walletId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const whereCondition: any = {
      status: 'pending_approval'
    };

    if (walletId) {
      whereCondition.walletId = walletId;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          wallet: true
        }
      }),
      prisma.transaction.count({ where: whereCondition }),
    ]);

    return mobileList(transactions, total, {
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Mobile fetch pending approval transactions error:', error);
    return mobileError('Failed to fetch pending approval transactions', 500);
  }
}

export async function POST(request: NextRequest) {
  const permCheck = await mobileRequirePermission(request, 'wallets:manage');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const body = await request.json();
    const { transactionIds } = body;

    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return mobileError('Transaction IDs are required', 400);
    }

    const results = [];
    const errors = [];

    for (const transactionId of transactionIds) {
      try {
        const transaction = await prisma.transaction.findUnique({
          where: { id: transactionId },
          include: { wallet: true }
        });

        if (!transaction) {
          errors.push({ transactionId, error: 'Transaction not found' });
          continue;
        }

        if (transaction.status !== 'pending_approval') {
          errors.push({ transactionId, error: 'Transaction is not pending approval' });
          continue;
        }

        if (transaction.wallet.balance < transaction.amount) {
          await prisma.transaction.update({
            where: { id: transactionId },
            data: {
              status: 'FAILED',
              resultDesc: 'Insufficient balance at time of approval'
            }
          });
          await notifyPayoutRejected(transactionId, 'Insufficient balance at time of approval');
          errors.push({ transactionId, error: 'Insufficient balance' });
          continue;
        }

        let payoutResponse;
        const payoutType = transaction.remarks || 'phone';

        if (payoutType === 'phone') {
          payoutResponse = await initiateB2C(
            transaction.phoneNumber || transaction.accountReference || '',
            transaction.amount,
            transaction.walletId,
            'BusinessPayment',
            transaction.description || transaction.transactionDesc || `Payment to ${transaction.accountReference}`,
            '',
            transactionId
          );
        } else if (payoutType === 'pochi') {
          payoutResponse = await initiateB2Pochi(
            transaction.phoneNumber || transaction.accountReference || '',
            transaction.amount,
            transaction.walletId,
            transaction.description || transaction.transactionDesc || `Pochi Payment to ${transaction.accountReference}`,
            transactionId
          );
        } else if (payoutType === 'paybill') {
          payoutResponse = await initiateB2B(
            transaction.accountReference || '',
            transaction.amount,
            transaction.walletId,
            transaction.phoneNumber || transaction.wallet.name,
            'BusinessPayBill',
            transaction.description || transaction.transactionDesc || `Payment to Paybill ${transaction.accountReference}`,
            transactionId
          );
        } else if (payoutType === 'till') {
          payoutResponse = await initiateB2B(
            transaction.accountReference || '',
            transaction.amount,
            transaction.walletId,
            transaction.wallet.name,
            'BusinessBuyGoods',
            transaction.description || transaction.transactionDesc || `Payment to Till Number ${transaction.accountReference}`,
            transactionId
          );
        } else {
          errors.push({ transactionId, error: 'Invalid payout type' });
          continue;
        }

        results.push({
          transactionId,
          success: true,
          mpesaResponse: payoutResponse
        });

        await notifyPayoutApproved(transactionId);

      } catch (error: any) {
        console.error(`Failed to approve transaction ${transactionId}:`, error);
        errors.push({ transactionId, error: error.message });
      }
    }

    return mobileSuccess({
      approved: results.length,
      failed: errors.length,
      results,
      errors
    }, 'Approvals processed');
  } catch (error: any) {
    console.error('Mobile approval error:', error);
    return mobileError(error.message || 'Failed to approve transactions', 500);
  }
}
