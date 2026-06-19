import { NextRequest, NextResponse } from 'next/server';
import { handleB2PochiCallback } from '@/lib/mpesa-service';

// Generic callback handler that returns appropriate response
const createCallbackResponse = (success: boolean, message: string = 'Processed') => {
  return NextResponse.json({
    ResultCode: success ? 0 : 1,
    ResultDesc: message
  });
};

// B2Pochi Callback
export async function POST(req: NextRequest) {
  try {
    const callbackData = await req.json();
    
    console.log('B2Pochi callback received:', JSON.stringify(callbackData, null, 2));

    // Validate callback structure
    if (!callbackData.Result) {
      return createCallbackResponse(false, 'Invalid callback format');
    }

    const result = await handleB2PochiCallback(callbackData);

    if (result.success) {
      return createCallbackResponse(true, 'Success');
    } else {
      return createCallbackResponse(false, result.error || 'Processing failed');
    }

  } catch (error: any) {
    console.error('B2Pochi callback error:', error);
    
    // Always return success to M-Pesa to prevent retries
    return createCallbackResponse(true, 'Processed');
  }
}