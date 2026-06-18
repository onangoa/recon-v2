import { NextRequest, NextResponse } from 'next/server';
import { initiateSTKPush, TransactionType } from '@/lib/mpesa-service';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      phoneNumber,
      amount,
      walletId,
      accountReference,
      transactionDesc
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

    // Initiate STK Push
    const result = await initiateSTKPush(
      phoneNumber,
      amount,
      walletId,
      accountReference || `WALLET_${walletId}`,
      transactionDesc
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'STK Push initiated successfully',
        data: {
          transactionId: result.transactionId,
          checkoutRequestId: result.checkoutRequestId,
          merchantRequestId: result.merchantRequestId,
          responseCode: result.responseCode,
          responseDescription: result.responseDescription,
          customerMessage: result.customerMessage
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
    console.error('STK Push error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to initiate STK Push',
      details: error.message
    }, { status: 500 });
  }
}