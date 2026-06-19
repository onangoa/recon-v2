import { NextRequest, NextResponse } from 'next/server';
import { initiateReversal, TransactionType } from '@/lib/mpesa-service';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';

export async function POST(req: NextRequest) {
  const permCheck = await requirePermission(req, 'wallets:manage');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const body = await req.json();
    const {
      transactionID,
      amount,
      walletId,
      remarks = 'Reversal Request'
    } = body;

    // Validate input
    if (!transactionID || !amount || !walletId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: transactionID, amount, walletId'
      }, { status: 400 });
    }

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Amount must be a positive number'
      }, { status: 400 });
    }

    // Check if wallet exists
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId }
    });

    if (!wallet) {
      return NextResponse.json({
        success: false,
        error: 'Wallet not found'
      }, { status: 404 });
    }

    // Initiate reversal
    const result = await initiateReversal(
      transactionID,
      amount,
      walletId,
      remarks
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Reversal initiated successfully',
        data: {
          transactionId: result.transactionId,
          conversationId: result.conversationId,
          originatorConversationId: result.originatorConversationId,
          responseCode: result.responseCode,
          responseDescription: result.responseDescription
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        responseCode: result.responseCode,
        transactionId: result.transactionId
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Reversal error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to initiate reversal',
      details: error.message
    }, { status: 500 });
  }
}