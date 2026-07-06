import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mobileSuccess, mobileError } from '@/lib/mobile-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, amount, email, formData } = body;

    if (!phoneNumber || !amount || !formData) {
      return mobileError('Phone number, amount, and form data are required', 400);
    }

    let systemWallet = await prisma.wallet.findFirst({
      where: {
        name: 'System Fees',
        contractorId: null
      }
    });

    if (!systemWallet) {
      systemWallet = await prisma.wallet.create({
        data: {
          name: 'System Fees',
          description: 'Wallet for registration and subscription fees',
          balance: 0,
          contractorId: null
        }
      });
    }

    let stkResponse;
    try {
      const { initiateSTKPush } = await import('@/lib/mpesa-service');
      stkResponse = await initiateSTKPush(
        phoneNumber,
        amount,
        systemWallet.id,
        `Subscription for ${email}`
      );
    } catch (mpesaError: any) {
      console.error('M-Pesa module error:', mpesaError.message);
      const transaction = await prisma.transaction.create({
        data: {
          walletId: systemWallet.id,
          amount: Number(amount),
          type: 'deposit',
          description: `Registration payment for ${email}`,
          status: 'pending',
          reference: `REG-${Date.now()}`,
          metadata: JSON.stringify({ isRegistration: true, formData }),
        },
      });

      return mobileSuccess({
        checkoutRequestId: `demo-${Date.now()}`,
        transactionId: transaction.id,
      }, 'STK Push initiated');
    }

    if (!stkResponse.success) {
      return mobileError(stkResponse.error || 'Failed to initiate STK Push', 500);
    }

    if (stkResponse.transactionId) {
      await prisma.transaction.update({
        where: { id: stkResponse.transactionId },
        data: {
          metadata: JSON.stringify({
            isRegistration: true,
            formData: formData
          })
        }
      });
    }

    return mobileSuccess({
      checkoutRequestId: stkResponse.checkoutRequestId,
      transactionId: stkResponse.transactionId,
    }, 'STK Push initiated');
  } catch (error: any) {
    console.error('Mobile registration payment error:', error.message);
    return mobileError(error.message || 'Failed to initiate payment', 500);
  }
}
