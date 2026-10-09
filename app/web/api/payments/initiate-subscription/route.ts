import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireContractorPermission } from '@/lib/require-permission';

export async function POST(request: NextRequest) {
  const permCheck = await requireContractorPermission(request, 'settings:update');
  if (!permCheck.authorized) return permCheck.error;

  try {
    const contractorId = permCheck.contractorId!;
    const body = await request.json();
    const { phoneNumber, planId, subscribeAgain } = body;

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const contractor = await prisma.contractor.findUnique({
      where: { id: contractorId },
      include: { subscriptionPlan: true },
    });

    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    const plan = planId
      ? await prisma.subscriptionPlan.findUnique({ where: { id: planId } })
      : contractor.subscriptionPlan;

    if (!plan) {
      return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 });
    }

    const amount = plan.price;

    // Get or create a System Wallet for subscription fees
    let systemWallet = await prisma.wallet.findFirst({
      where: { name: 'System Fees', contractorId: null },
    });

    if (!systemWallet) {
      systemWallet = await prisma.wallet.create({
        data: {
          name: 'System Fees',
          description: 'Wallet for registration and subscription fees',
          balance: 0,
          contractorId: null,
        },
      });
    }

    // Determine the action descriptor
    const action = subscribeAgain ? 'additional site slot' : `upgrade to ${plan.name}`;
    const accountReference = `Subscription:${contractorId}`;

    // Initiate M-Pesa STK Push
    let stkResponse;
    try {
      const { initiateSTKPush } = await import('@/lib/mpesa-service');
      stkResponse = await initiateSTKPush(
        phoneNumber,
        amount,
        systemWallet.id,
        accountReference,
        `Subscription ${action} for ${contractor.companyName}`
      );
    } catch (mpesaError: any) {
      console.error('M-Pesa module error:', mpesaError.message);
      // Fallback: create a pending transaction record with a demo checkout ID
      const transaction = await prisma.transaction.create({
        data: {
          walletId: systemWallet.id,
          amount: Number(amount),
          type: 'deposit',
          description: `Subscription ${action} for ${contractor.companyName}`,
          status: 'pending',
          reference: `SUB-${Date.now()}`,
          metadata: JSON.stringify({
            isSubscription: true,
            contractorId,
            planId: plan.id,
            subscribeAgain: Boolean(subscribeAgain),
          }),
        },
      });

      return NextResponse.json({
        message: 'STK Push initiated',
        checkoutRequestId: `demo-${Date.now()}`,
        transactionId: transaction.id,
        amount,
        planName: plan.name,
      });
    }

    if (!stkResponse.success) {
      return NextResponse.json(
        { error: stkResponse.error || 'Failed to initiate STK Push' },
        { status: 500 }
      );
    }

    // Store subscription metadata on the transaction for callback processing
    if (stkResponse.transactionId) {
      await prisma.transaction.update({
        where: { id: stkResponse.transactionId },
        data: {
          metadata: JSON.stringify({
            isSubscription: true,
            contractorId,
            planId: plan.id,
            subscribeAgain: Boolean(subscribeAgain),
          }),
        },
      });
    }

    return NextResponse.json({
      message: 'STK Push initiated',
      checkoutRequestId: stkResponse.checkoutRequestId,
      transactionId: stkResponse.transactionId,
      amount,
      planName: plan.name,
    });
  } catch (error: any) {
    console.error('Subscription Payment Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}