import { NextRequest } from 'next/server';
import { initiateB2Pochi } from '@/lib/mpesa-service';
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
      remarks
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

    if (wallet.balance < amount) {
      return mobileError('Insufficient wallet balance', 400);
    }

    const result = await initiateB2Pochi(
      phoneNumber,
      amount,
      walletId,
      remarks
    );

    if (result.success) {
      return mobileSuccess({
        transactionId: result.transactionId,
        conversationId: result.conversationId,
        originatorConversationId: result.originatorConversationId,
        responseCode: result.responseCode,
        responseDescription: result.responseDescription
      }, 'B2Pochi payment initiated successfully');
    } else {
      return mobileError(result.error, 400);
    }

  } catch (error: any) {
    console.error('Mobile B2Pochi error:', error);
    return mobileError('Failed to initiate B2Pochi payment', 500);
  }
}
