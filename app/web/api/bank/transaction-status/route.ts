import { NextRequest, NextResponse } from 'next/server';
import { checkBankTransactionStatus } from '@/lib/bank-service';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';

export async function POST(request: NextRequest) {
  const permCheck = await requirePermission(request, 'wallets:read');
  if (!permCheck.authorized) return permCheck.error;

  try {
    const body = await request.json();
    const { messageReference, transactionId, userId } = body;

    let reference = messageReference;

    // If a local transaction id is provided, resolve its bank message reference
    if (!reference && transactionId) {
      const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
      if (!tx) {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }
      reference = tx.externalId || tx.reference || undefined;
    }

    if (!reference) {
      return NextResponse.json({ error: 'messageReference or transactionId is required' }, { status: 400 });
    }

    const result = await checkBankTransactionStatus({ messageReference: reference, userId });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Bank transaction status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check bank transaction status' },
      { status: 500 }
    );
  }
}