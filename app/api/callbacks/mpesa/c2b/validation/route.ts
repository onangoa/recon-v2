import { NextRequest, NextResponse } from 'next/server';
import { handleC2BValidation } from '@/lib/mpesa-service';

// C2B Validation Callback
export async function POST(req: NextRequest) {
  try {
    const callbackData = await req.json();
    
    console.log('C2B validation received:', JSON.stringify(callbackData, null, 2));

    // Validate callback structure
    if (!callbackData.TransID || !callbackData.TransAmount) {
      return NextResponse.json({
        ResultCode: 1,
        ResultDesc: 'Invalid callback format'
      });
    }

    const result = await handleC2BValidation(callbackData);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('C2B validation error:', error);
    
    // Return rejection on error
    return NextResponse.json({
      ResultCode: 1,
      ResultDesc: 'Validation failed',
      ThirdPartyTransID: callbackData.TransID
    });
  }
}