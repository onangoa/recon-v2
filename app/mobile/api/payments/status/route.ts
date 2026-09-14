import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mobileSuccess, mobileError } from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkoutRequestId = searchParams.get('checkoutRequestId');

    if (!checkoutRequestId) {
      return mobileError('CheckoutRequestID is required', 400);
    }

    const transaction = await prisma.transaction.findFirst({
      where: { checkoutRequestId },
    });

    if (!transaction) {
      return mobileSuccess({ status: 'not_found' });
    }

    return mobileSuccess({
      status: transaction.status,
      transactionId: transaction.id,
    });
  } catch (error: any) {
    console.error('Mobile payment status check error:', error.message);
    return mobileError('Failed to check status', 500);
  }
}
