import { NextResponse } from 'next/server';
import { WalletService } from '@/lib/wallet-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = body.Result;

    const externalId = result.ConversationID; // B2C/B2B uses ConversationID
    const resultCode = result.ResultCode;
    const resultDesc = result.ResultDesc;

    if (resultCode === 0) {
      // Success
      const receiptNumber = result.TransactionID;
      await WalletService.completeTransaction(externalId, receiptNumber);
      console.log(`Payout Success: ${externalId}, Receipt: ${receiptNumber}`);
    } else {
      // Failed
      await WalletService.failTransaction(externalId, resultDesc);
      console.log(`Payout Failed: ${externalId}, Reason: ${resultDesc}`);
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error: any) {
    console.error('M-Pesa Payout Callback Error:', error.message);
    return NextResponse.json({ ResultCode: 1, ResultDesc: 'Internal Server Error' }, { status: 500 });
  }
}
