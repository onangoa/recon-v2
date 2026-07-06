import { NextRequest, NextResponse } from 'next/server';
import { handleBankFundsTransferCallback } from '@/lib/bank-service';

const createCallbackResponse = (success: boolean, message: string = 'Processed') => {
  return NextResponse.json({
    Status: success ? 'Success' : 'Failed',
    StatusDescription: message,
  });
};

export async function POST(req: NextRequest) {
  try {
    const callbackData = await req.json();
    console.log('Bank funds-transfer callback received:', JSON.stringify(callbackData, null, 2));

    const result = await handleBankFundsTransferCallback(callbackData);

    if (result.success) {
      return createCallbackResponse(true, 'Success');
    }
    return createCallbackResponse(false, result.error || 'Processing failed');
  } catch (error: any) {
    console.error('Bank funds-transfer callback error:', error);
    // Always acknowledge to the bank to prevent retries
    return createCallbackResponse(true, 'Processed');
  }
}