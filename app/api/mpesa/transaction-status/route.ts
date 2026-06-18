import { NextRequest, NextResponse } from 'next/server';
import { checkTransactionStatus, TransactionType } from '@/lib/mpesa-service';
import { getTransaction } from '@/lib/mpesa-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      transactionID,
      remarks = 'Status Query',
      walletId
    } = body;

    // Validate input
    if (!transactionID) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: transactionID'
      }, { status: 400 });
    }

    // Check transaction status
    const result = await checkTransactionStatus(
      transactionID,
      remarks,
      walletId
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Transaction status retrieved successfully',
        data: {
          responseCode: result.responseCode,
          responseDescription: result.responseDescription,
          result: result.result,
          transactionId: result.transactionId
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.responseDescription,
        responseCode: result.responseCode
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Transaction status error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to query transaction status',
      details: error.message
    }, { status: 500 });
  }
}

// GET endpoint to check local transaction status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: transactionId'
      }, { status: 400 });
    }

    // Get transaction from local database
    const transaction = await getTransaction(transactionId);

    if (!transaction) {
      return NextResponse.json({
        success: false,
        error: 'Transaction not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: transaction
    });

  } catch (error: any) {
    console.error('Get transaction error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve transaction',
      details: error.message
    }, { status: 500 });
  }
}