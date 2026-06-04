import { NextResponse } from 'next/server';
import { WalletService } from '@/lib/wallet-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = body.Body.stkCallback;

    const externalId = result.CheckoutRequestID;
    const resultCode = result.ResultCode;
    const resultDesc = result.ResultDesc;

    if (resultCode === 0) {
      // Success
      const callbackMetadata = result.CallbackMetadata.Item;
      const receiptNumber = callbackMetadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
      
      await WalletService.completeTransaction(externalId, receiptNumber);
      console.log(`STK Push Success: ${externalId}, Receipt: ${receiptNumber}`);
    } else {
      // Failed
      await WalletService.failTransaction(externalId, resultDesc);
      console.log(`STK Push Failed: ${externalId}, Reason: ${resultDesc}`);
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error: any) {
    console.error('M-Pesa STK Callback Error:', error.message);
    return NextResponse.json({ ResultCode: 1, ResultDesc: 'Internal Server Error' }, { status: 500 });
  }
}
