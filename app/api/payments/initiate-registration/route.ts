import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { initiateSTKPush } from '@/lib/mpesa';
import { WalletService } from '@/lib/wallet-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, amount, email } = body;

    if (!phoneNumber || !amount) {
      return NextResponse.json({ error: 'Phone number and amount are required' }, { status: 400 });
    }

    // 1. Get or create a System Wallet for registration fees
    let systemWallet = await prisma.wallet.findFirst({
      where: { name: 'System Fees' }
    });

    if (!systemWallet) {
      systemWallet = await prisma.wallet.create({
        data: {
          name: 'System Fees',
          description: 'Wallet for registration and subscription fees',
          balance: 0,
        }
      });
    }

    // 2. Initiate M-Pesa STK Push
    const stkResponse = await initiateSTKPush(
      phoneNumber,
      amount,
      'Registration',
      `Subscription for ${email}`
    );

    // 3. Create a pending transaction
    await WalletService.createPendingTransaction({
      walletId: systemWallet.id,
      amount: amount,
      type: 'credit',
      description: `Registration subscription for ${email}`,
      externalId: stkResponse.CheckoutRequestID,
      referenceNumber: stkResponse.MerchantRequestID,
    });

    return NextResponse.json({
      message: 'STK Push initiated',
      checkoutRequestId: stkResponse.CheckoutRequestID,
    });
  } catch (error: any) {
    console.error('Registration Payment Error:', error.message);
    return NextResponse.json({ error: error.message || 'Failed to initiate payment' }, { status: 500 });
  }
}
