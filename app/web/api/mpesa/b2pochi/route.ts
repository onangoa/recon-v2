import { NextRequest, NextResponse } from 'next/server';
import { initiateB2Pochi, TransactionType } from '@/lib/mpesa-service';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';

export async function POST(req: NextRequest) {
  const permCheck = await requirePermission(req, 'wallets:create');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const body = await req.json();
    const {
      phoneNumber,
      amount,
      walletId,
      remarks
    } = body;

    // Validate input
    if (!phoneNumber || !amount || !walletId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: phoneNumber, amount, walletId'
      }, { status: 400 });
    }

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Amount must be a positive number'
      }, { status: 400 });
    }

    // Validate phone number format
    const phoneRegex = /^(?:254|\+254|0)?[17]\d{8}$/;
    if (!phoneRegex.test(phoneNumber.toString())) {
      return NextResponse.json({
        success: false,
        error: 'Invalid phone number format'
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

    // Initiate B2Pochi
    const result = await initiateB2Pochi(
      phoneNumber,
      amount,
      walletId,
      remarks
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'B2Pochi payment initiated successfully',
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
    console.error('B2Pochi error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to initiate B2Pochi payment',
      details: error.message
    }, { status: 500 });
  }
}