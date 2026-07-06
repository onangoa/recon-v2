import { NextRequest } from 'next/server';
import { initiateReversal } from '@/lib/mpesa-service';
import { prisma } from '@/lib/prisma';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function POST(req: NextRequest) {
  const permCheck = await mobileRequirePermission(req, 'wallets:manage');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const body = await req.json();
    const {
      transactionID,
      amount,
      walletId,
      remarks = 'Reversal Request'
    } = body;

    if (!transactionID || !amount || !walletId) {
      return mobileError('Missing required fields: transactionID, amount, walletId', 400);
    }

    if (isNaN(amount) || amount <= 0) {
      return mobileError('Amount must be a positive number', 400);
    }

    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId }
    });

    if (!wallet) {
      return mobileError('Wallet not found', 404);
    }

    const result = await initiateReversal(
      transactionID,
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
      }, 'Reversal initiated successfully');
    } else {
      return mobileError(result.error, 400);
    }

  } catch (error: any) {
    console.error('Mobile reversal error:', error);
    return mobileError('Failed to initiate reversal', 500);
  }
}
