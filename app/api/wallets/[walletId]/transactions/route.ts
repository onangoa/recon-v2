import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ walletId: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { walletId } = await params;

  const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
  if (!wallet) return mobileError('Wallet not found', 404);

  const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { walletId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where: { walletId } }),
  ]);

  return mobileSuccess({
    data: transactions.map(t => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      description: t.description,
      status: t.status,
      reference: t.reference,
      receipt_number: t.mpesaReceiptNumber || t.receiptNumber,
      phone_number: t.phoneNumber,
      transaction_type: t.transactionType,
      created_at: t.createdAt,
    })),
    meta: { page, limit, total },
  });
}