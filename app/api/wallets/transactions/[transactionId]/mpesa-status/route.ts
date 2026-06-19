import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ transactionId: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { transactionId } = await params;

  const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!transaction) return mobileError('Transaction not found', 404);

  return mobileSuccess({
    id: transaction.id,
    amount: transaction.amount,
    type: transaction.type,
    description: transaction.description,
    status: transaction.status,
    reference: transaction.reference,
    mpesa_receipt: transaction.mpesaReceiptNumber,
    receipt_number: transaction.receiptNumber,
    phone_number: transaction.phoneNumber,
    transaction_type: transaction.transactionType,
    result_code: transaction.resultCode,
    result_desc: transaction.resultDesc,
    created_at: transaction.createdAt,
    callback_received: !!transaction.callbackReceivedAt,
  });
}