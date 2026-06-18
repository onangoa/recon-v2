import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { initiateSTKPush } from '@/lib/mpesa';
import { WalletService } from '@/lib/wallet-service';

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
    const stkResponse = await initiateSTKPush(
      phoneNumber,
      amount,
      systemWallet.id, // Use wallet ID as reference
      `Subscription for ${email}`
    );

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
      checkoutRequestId: stkResponse.CheckoutRequestID,
      transactionId: stkResponse.transactionId,
    });
  } catch (error: any) {
    console.error('Registration Payment Error:', error.message);
    return NextResponse.json({ error: error.message || 'Failed to initiate payment' }, { status: 500 });
  }
}
