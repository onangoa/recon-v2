import { NextRequest } from 'next/server';
import { initiateSTKPush } from '@/lib/mpesa-service';
import { prisma } from '@/lib/prisma';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function POST(req: NextRequest) {
  const permCheck = await mobileRequirePermission(req, 'wallets:create');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const body = await req.json();
    const {
      phoneNumber,
      amount,
      walletId,
      accountReference,
      transactionDesc
    } = body;

    if (!phoneNumber || !amount || !walletId) {
      return mobileError('Missing required fields: phoneNumber, amount, walletId', 400);
    }

    if (isNaN(amount) || amount <= 0) {
      return mobileError('Amount must be a positive number', 400);
    }

    const phoneRegex = /^(?:254|\+254|0)?[17]\d{8}$/;
    if (!phoneRegex.test(phoneNumber.toString())) {
      return mobileError('Invalid phone number format', 400);
    }

    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId }
    });

    if (!wallet) {
      return mobileError('Wallet not found', 404);
    }

    const result = await initiateSTKPush(
      phoneNumber,
      amount,
      walletId,
      accountReference || `WALLET_${walletId}`,
      transactionDesc
    );

    if (result.success) {
      return mobileSuccess({
        transactionId: result.transactionId,
        checkoutRequestId: result.checkoutRequestId,
        merchantRequestId: result.merchantRequestId,
        responseCode: result.responseCode,
        responseDescription: result.responseDescription,
        customerMessage: result.customerMessage
      }, 'STK Push initiated successfully');
    } else {
      return mobileError(result.error, 400);
    }

  } catch (error: any) {
    console.error('Mobile STK Push error:', error);
    return mobileError('Failed to initiate STK Push', 500);
  }
}
