import { NextRequest, NextResponse } from 'next/server';
import { checkAccountBalance, TransactionType } from '@/lib/mpesa-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      remarks = 'Balance Query',
      walletId
    } = body;

    // Check account balance
    const result = await checkAccountBalance(
      remarks,
      walletId
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Account balance retrieved successfully',
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
    console.error('Account balance error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to query account balance',
      details: error.message
    }, { status: 500 });
  }
}