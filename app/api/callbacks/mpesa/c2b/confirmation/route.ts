import { NextRequest, NextResponse } from 'next/server';
import { handleC2BConfirmation } from '@/lib/mpesa-service';

// Generic callback handler that returns appropriate response
const createCallbackResponse = (success: boolean, message: string = 'Processed') => {
  return NextResponse.json({
    ResultCode: success ? 0 : 1,
    ResultDesc: message
  });
};

// C2B Confirmation Callback
export async function POST(req: NextRequest) {
  try {
    const callbackData = await req.json();
    
    console.log('C2B confirmation received:', JSON.stringify(callbackData, null, 2));

    // Validate callback structure
    if (!callbackData.TransID || !callbackData.TransAmount) {
      return createCallbackResponse(false, 'Invalid callback format');
    }

    const result = await handleC2BConfirmation(callbackData);

    if (result.success) {
      return createCallbackResponse(true, 'Confirmation received successfully');
    } else {
      return createCallbackResponse(false, result.error || 'Processing failed');
    }

  } catch (error: any) {
    console.error('C2B confirmation error:', error);
    
    // Always return success to M-Pesa to prevent retries
    return createCallbackResponse(true, 'Confirmation received successfully');
  }
}