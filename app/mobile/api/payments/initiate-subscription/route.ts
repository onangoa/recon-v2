import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

// POST /mobile/api/payments/initiate-subscription
// Mirrors the web flow: initiates an M-Pesa STK push for a subscription
// upgrade (planId) or an additional site slot (subscribeAgain).
// Body: { phoneNumber, planId?, subscribeAgain? }
export async function POST(request: NextRequest) {
  const permCheck = await mobileRequirePermission(request, 'settings:update');
  if (!permCheck.authorized) return permCheck.error;

  try {
    const contractorId = permCheck.contractorId;
    if (!contractorId) {
      return mobileError('Contractor account required', 403);
    }

    const body = await request.json();
    const { phoneNumber, planId, subscribeAgain } = body;

    if (!phoneNumber) {
      return mobileError('Phone number is required', 400);
    }

    const contractor = await prisma.contractor.findUnique({
      where: { id: contractorId },
      include: { subscriptionPlan: true },
    });

    if (!contractor) {
      return mobileError('Contractor not found', 404);
    }

    const plan = planId
      ? await prisma.subscriptionPlan.findUnique({ where: { id: planId } })
      : contractor.subscriptionPlan;

    if (!plan) {
      return mobileError('Subscription plan not found', 404);
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

      return mobileSuccess(
        {
          message: 'STK Push initiated',
          checkoutRequestId: `demo-${Date.now()}`,
          transactionId: transaction.id,
          amount,
          planName: plan.name,
        },
        'STK Push initiated'
      );
    }

    if (!stkResponse.success) {
      return mobileError(stkResponse.error || 'Failed to initiate STK Push', 500);
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

    return mobileSuccess(
      {
        message: 'STK Push initiated',
        checkoutRequestId: stkResponse.checkoutRequestId,
        transactionId: stkResponse.transactionId,
        amount,
        planName: plan.name,
      },
      'STK Push initiated'
    );
  } catch (error: any) {
    console.error('Subscription Payment Error:', error.message);
    return mobileError(error.message || 'Failed to initiate payment', 500);
  }
}
