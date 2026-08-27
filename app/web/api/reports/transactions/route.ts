import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';

export async function GET(request: NextRequest) {
  try {
    const permCheck = await requirePermission(request, 'reports:read');
    if (!permCheck.authorized) return permCheck.error;

    const contractorId = permCheck.contractorId;
    if (!contractorId) {
      return NextResponse.json({ error: 'Contractor account required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const walletId = searchParams.get('walletId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const where: any = { wallet: { contractorId } };

    if (walletId) {
      where.walletId = walletId;
    }
    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.createdAt = { gte: new Date(startDate) };
    } else if (endDate) {
      where.createdAt = { lte: new Date(endDate) };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        wallet: { select: { id: true, name: true, currency: true } },
      },
    });

    const totalCredit = transactions
      .filter((t) => t.type === 'credit' && (t.status === 'completed' || t.status === 'SUCCESS'))
      .reduce((sum, t) => sum + t.amount, 0);
    const totalDebit = transactions
      .filter((t) => t.type === 'debit' && (t.status === 'completed' || t.status === 'SUCCESS'))
      .reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        status: t.status,
        reference: t.reference,
        receiptNumber: t.receiptNumber,
        recipientName: t.recipientName,
        proofDocumentUrl: t.proofDocumentUrl,
        proofDocumentName: t.proofDocumentName,
        transactionType: t.transactionType,
        phoneNumber: t.phoneNumber,
        accountReference: t.accountReference,
        remarks: t.remarks,
        createdAt: t.createdAt,
        walletName: t.wallet.name,
        currency: t.wallet.currency,
      })),
      summary: {
        totalCredit,
        totalDebit,
        net: totalCredit - totalDebit,
        count: transactions.length,
      },
    });
  } catch (error) {
    console.error('Transactions report API error:', error);
    return NextResponse.json({ error: 'Failed to generate transactions report' }, { status: 500 });
  }
}
