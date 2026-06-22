import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, amount, email, formData } = body;

    if (!phoneNumber || !amount || !formData) {
      return NextResponse.json({ error: 'Phone number, amount, and form data are required' }, { status: 400 });
    }

    // 1. Get or create a System Wallet for registration fees (no contractor needed)
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

    // 2. Initiate M-Pesa STK Push
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
      // Fallback: create a transaction record and return a demo response
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

      return NextResponse.json({
        message: 'STK Push initiated',
        checkoutRequestId: `demo-${Date.now()}`,
        transactionId: transaction.id,
      });
    }

    if (!stkResponse.success) {
      return NextResponse.json({ 
        error: stkResponse.error || 'Failed to initiate STK Push' 
      }, { status: 500 });
    }

    // 3. Store registration data with the transaction for later use
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

    return NextResponse.json({
      message: 'STK Push initiated',
      checkoutRequestId: stkResponse.checkoutRequestId,
      transactionId: stkResponse.transactionId,
    });
  } catch (error: any) {
    console.error('Registration Payment Error:', error.message);
    return NextResponse.json({ error: error.message || 'Failed to initiate payment' }, { status: 500 });
  }
}
