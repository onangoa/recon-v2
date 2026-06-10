import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const checkoutRequestId = searchParams.get('checkoutRequestId');

    if (!checkoutRequestId) {
      return NextResponse.json({ error: 'CheckoutRequestID is required' }, { status: 400 });
    }

    const transaction = await prisma.transaction.findFirst({
      where: { externalId: checkoutRequestId },
    });

    if (!transaction) {
      return NextResponse.json({ status: 'not_found' });
    }

    return NextResponse.json({ status: transaction.status });
  } catch (error: any) {
    console.error('Payment Status Check Error:', error.message);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}
