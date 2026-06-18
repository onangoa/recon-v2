import { NextRequest, NextResponse } from 'next/server';
import {
  handleSTKPushCallback,
  handleB2CCallback,
  handleB2BCallback,
  handleB2PochiCallback,
  handleC2BConfirmation,
  handleC2BValidation,
  handleTransactionStatusCallback,
  handleAccountBalanceCallback,
  handleReversalCallback
} from '@/lib/mpesa-service';

// Generic callback handler that returns appropriate response
const createCallbackResponse = (success: boolean, message: string = 'Processed') => {
  return NextResponse.json({
    ResultCode: success ? 0 : 1,
    ResultDesc: message
  });
};

// STK Push Callback
export async function POST(req: NextRequest) {
  try {
    const callbackData = await req.json();
    
    console.log('STK Push callback received:', JSON.stringify(callbackData, null, 2));

    // Validate callback structure
    if (!callbackData.Body || !callbackData.Body.stkCallback) {
      return createCallbackResponse(false, 'Invalid callback format');
    }

    const result = await handleSTKPushCallback(callbackData);

    if (result.success) {
      return createCallbackResponse(true, 'Success');
    } else {
      return createCallbackResponse(false, result.error || 'Processing failed');
    }

  } catch (error: any) {
    console.error('STK Push callback error:', error);
    
    // Always return success to M-Pesa to prevent retries
    return createCallbackResponse(true, 'Processed');
  }
}