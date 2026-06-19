import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth-middleware';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { walletId } = body;

    if (!walletId) {
      return NextResponse.json({ error: 'Wallet ID is required' }, { status: 400 });
    }

    const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const period = await prisma.payrollPeriod.findUnique({
      where: { id },
      include: {
        salarySlips: {
          include: {
            worker: true,
          },
        },
      },
    });

    if (!period) {
      return NextResponse.json({ error: 'Payroll period not found' }, { status: 404 });
    }

    if (period.status !== 'completed') {
      return NextResponse.json({ error: 'Payroll must be completed before disbursement' }, { status: 400 });
    }

    if (wallet.balance < period.totalNetPay) {
      return NextResponse.json({ error: `Insufficient wallet balance. Balance: ${wallet.balance}, Required: ${period.totalNetPay}` }, { status: 400 });
    }

    const results = {
      total: period.salarySlips.length,
      mpesa: 0,
      manual: 0,
      skipped: 0,
      transactions: [] as any[],
    };

    for (const slip of period.salarySlips) {
      const worker = slip.worker;

      if (worker.paymentMode === 'manual' || !worker.paymentMode) {
        const transaction = await prisma.transaction.create({
          data: {
            walletId: wallet.id,
            type: 'debit',
            amount: slip.netPay,
            description: `Payroll: ${worker.name} - ${period.name}`,
            reference: `PAYROLL-${period.id.substring(0, 8)}-${slip.id.substring(0, 8)}`,
            status: 'completed',
            transactionType: 'PAYROLL_MANUAL',
            accountReference: worker.name,
            phoneNumber: worker.phone,
          },
        });

        await prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: { decrement: slip.netPay } },
        });

        await prisma.salarySlip.update({
          where: { id: slip.id },
          data: { status: 'paid' },
        });

        results.manual++;
        results.transactions.push({
          slipId: slip.id,
          workerName: worker.name,
          netPay: slip.netPay,
          mode: 'manual',
          transactionId: transaction.id,
          status: 'completed',
        });
        continue;
      }

      let transactionType = 'B2C';
      let payoutType = 'phone';
      let phoneNumber = worker.paymentPhone || worker.phone || '';
      let accountNumber = worker.paymentAccount || '';

      if (worker.paymentMode === 'pochi') {
        transactionType = 'B2POCHI';
        payoutType = 'pochi';
        phoneNumber = worker.paymentPhone || worker.phone || '';
      } else if (worker.paymentMode === 'till') {
        transactionType = 'B2B';
        payoutType = 'till';
        accountNumber = worker.paymentAccount || '';
      } else if (worker.paymentMode === 'paybill') {
        transactionType = 'B2B';
        payoutType = 'paybill';
        accountNumber = worker.paymentAccount || '';
        phoneNumber = worker.paymentPhone || '';
      }

      if (worker.paymentMode === 'phone' && !phoneNumber) {
        results.skipped++;
        results.transactions.push({
          slipId: slip.id,
          workerName: worker.name,
          netPay: slip.netPay,
          mode: worker.paymentMode,
          status: 'skipped',
          reason: 'No phone number',
        });
        continue;
      }

      if ((worker.paymentMode === 'till' || worker.paymentMode === 'paybill') && !accountNumber) {
        results.skipped++;
        results.transactions.push({
          slipId: slip.id,
          workerName: worker.name,
          netPay: slip.netPay,
          mode: worker.paymentMode,
          status: 'skipped',
          reason: 'No account number',
        });
        continue;
      }

      const transaction = await prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'debit',
          amount: slip.netPay,
          description: `Payroll: ${worker.name} - ${period.name}`,
          reference: `PAYROLL-${period.id.substring(0, 8)}-${slip.id.substring(0, 8)}`,
          status: 'pending_approval',
          transactionType,
          payoutType,
          accountReference: worker.paymentMode === 'phone' || worker.paymentMode === 'pochi' ? phoneNumber : accountNumber,
          transactionDesc: `Payroll: ${worker.name} - ${period.name}`,
          remarks: payoutType,
          phoneNumber: (worker.paymentMode === 'phone' || worker.paymentMode === 'pochi') ? phoneNumber : undefined,
        },
      });

      await prisma.salarySlip.update({
        where: { id: slip.id },
        data: { status: 'paid' },
      });

      results.mpesa++;
      results.transactions.push({
        slipId: slip.id,
        workerName: worker.name,
        netPay: slip.netPay,
        mode: worker.paymentMode,
        transactionId: transaction.id,
        status: 'pending_approval',
      });
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Payroll disbursement error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process disbursement' }, { status: 500 });
  }
}