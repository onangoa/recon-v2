import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const checkoutRequestId = searchParams.get('checkoutRequestId');

    console.log('Payment status check for checkoutRequestId:', checkoutRequestId);

    if (!checkoutRequestId) {
      return NextResponse.json({ error: 'CheckoutRequestID is required' }, { status: 400 });
    }

    const transaction = await prisma.transaction.findFirst({
      where: { checkoutRequestId },
    });

    console.log('Found transaction:', transaction?.id, transaction?.status);

    if (!transaction) {
      console.warn(`Transaction not found for CheckoutRequestID: ${checkoutRequestId}`);
      return NextResponse.json({ status: 'not_found', registrationStatus: null });
    }

    // Parse metadata for registration status
    let registrationStatus = null;
    if (transaction.metadata) {
      try {
        const metadata = JSON.parse(transaction.metadata);
        registrationStatus = metadata.registrationStatus || null;
      } catch (error) {
        console.error('Failed to parse transaction metadata:', error);
      }
    }

    return NextResponse.json({ 
      status: transaction.status,
      transactionId: transaction.id,
      registrationStatus
    });
  } catch (error: any) {
    console.error('Payment Status Check Error:', error.message);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}
