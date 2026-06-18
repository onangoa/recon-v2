import { NextRequest, NextResponse } from 'next/server';
import { initiateB2B, TransactionType } from '@/lib/mpesa-service';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      receiverShortCode,
      amount,
      walletId,
      accountReference,
      commandID = 'BusinessPayBill',
      remarks
    } = body;

    // Validate input
    if (!receiverShortCode || !amount || !walletId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: receiverShortCode, amount, walletId'
      }, { status: 400 });
    }

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Amount must be a positive number'
      }, { status: 400 });
    }

    // Check if wallet exists and has sufficient balance
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId }
    });

    if (!wallet) {
      return NextResponse.json({
        success: false,
        error: 'Wallet not found'
      }, { status: 404 });
    }

    if (wallet.balance < amount) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient wallet balance'
      }, { status: 400 });
    }

    // Initiate B2B
    const result = await initiateB2B(
      receiverShortCode,
      amount,
      walletId,
      accountReference || `Transfer to ${receiverShortCode}`,
      commandID,
      remarks
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'B2B transfer initiated successfully',
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
    console.error('B2B error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to initiate B2B transfer',
      details: error.message
    }, { status: 500 });
  }
}