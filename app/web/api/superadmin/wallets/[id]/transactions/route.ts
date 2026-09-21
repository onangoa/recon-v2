import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperadmin } from '@/lib/require-permission';
import {
  getDirection,
  getChannel,
  isSettled,
  BALANCE_TOLERANCE,
} from '@/lib/transaction-ledger';

// Full per-wallet ledger for the superadmin wallet trace view: every bank,
// M-Pesa and internal transaction in chronological order with a running
// balance, plus a reconciliation of the ledger against the stored balance.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireSuperadmin(request);
  if (!adminCheck.authorized) return adminCheck.error;
  try {
    const { id } = await params;

    const wallet = await prisma.wallet.findUnique({
      where: { id },
      include: { contractor: { select: { id: true, companyName: true } } },
    });
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const transactions = await prisma.transaction.findMany({
      where: { walletId: id },
      orderBy: { createdAt: 'asc' },
    });

    // Walk the ledger chronologically and attach the wallet balance after
    // every settled (balance-affecting) transaction. Non-settled rows never
    // moved the stored balance, so the running balance carries past them.
    let runningBalance = 0;
    const ledger = transactions.map((tx) => {
      const direction = getDirection(tx);
      const settled = direction !== null && isSettled(tx.status);
      if (settled && direction) {
        runningBalance += direction === 'credit' ? tx.amount : -tx.amount;
      }
      return {
        id: tx.id,
        type: tx.type,
        status: tx.status,
        channel: getChannel(tx),
        direction,
        settled,
        amount: tx.amount,
        description: tx.description,
        transactionDesc: tx.transactionDesc,
        reference: tx.reference,
        receiptNumber: tx.receiptNumber,
        mpesaReceiptNumber: tx.mpesaReceiptNumber,
        mpesaTransactionId: tx.mpesaTransactionId,
        transactionType: tx.transactionType,
        accountReference: tx.accountReference,
        phoneNumber: tx.phoneNumber,
        remarks: tx.remarks,
        recipientName: tx.recipientName,
        createdAt: tx.createdAt,
        balanceAfter: runningBalance,
      };
    });

    const settledRows = ledger.filter((tx) => tx.settled);
    const totalCredit = settledRows
      .filter((tx) => tx.direction === 'credit')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const totalDebit = settledRows
      .filter((tx) => tx.direction === 'debit')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const byChannel: Record<
      string,
      { credit: number; debit: number; creditCount: number; debitCount: number }
    > = {
      mpesa: { credit: 0, debit: 0, creditCount: 0, debitCount: 0 },
      bank: { credit: 0, debit: 0, creditCount: 0, debitCount: 0 },
      internal: { credit: 0, debit: 0, creditCount: 0, debitCount: 0 },
    };
    for (const tx of settledRows) {
      const bucket = byChannel[tx.channel];
      if (tx.direction === 'credit') {
        bucket.credit += tx.amount;
        bucket.creditCount += 1;
      } else {
        bucket.debit += tx.amount;
        bucket.debitCount += 1;
      }
    }

    const statusCounts: Record<string, number> = {};
    for (const tx of ledger) {
      statusCounts[tx.status] = (statusCounts[tx.status] ?? 0) + 1;
    }

    const computedBalance = totalCredit - totalDebit;
    const variance = wallet.balance - computedBalance;

    return NextResponse.json({
      wallet: {
        id: wallet.id,
        name: wallet.name,
        description: wallet.description,
        balance: wallet.balance,
        currency: wallet.currency,
        status: wallet.status,
        contractor: wallet.contractor
          ? { id: wallet.contractor.id, companyName: wallet.contractor.companyName }
          : null,
      },
      transactions: [...ledger].reverse(),
      summary: {
        storedBalance: wallet.balance,
        totalCredit,
        totalDebit,
        computedBalance,
        variance,
        balanced: Math.abs(variance) < BALANCE_TOLERANCE,
        transactionCount: ledger.length,
        settledCount: settledRows.length,
        pendingCount: ledger.length - settledRows.length,
        byChannel,
        statusCounts,
      },
    });
  } catch (error) {
    console.error('Fetch wallet ledger error:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet transactions' }, { status: 500 });
  }
}
