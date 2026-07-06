import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequirePermission(request, 'wallets:manage');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { reason } = body;

    const transaction = await prisma.transaction.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!transaction) {
      return mobileError('Transaction not found', 404);
    }

    if (transaction.status !== 'pending_approval') {
      return mobileError('Transaction is not pending approval', 400);
    }

    await prisma.transaction.update({
      where: { id: resolvedParams.id },
      data: {
        status: 'CANCELLED',
        resultDesc: reason || 'Transaction rejected by admin'
      }
    });

    return mobileSuccess(null, 'Transaction rejected successfully');
  } catch (error: any) {
    console.error('Mobile reject transaction error:', error);
    return mobileError(error.message || 'Failed to reject transaction', 500);
  }
}
