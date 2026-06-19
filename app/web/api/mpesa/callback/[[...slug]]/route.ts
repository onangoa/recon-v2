import { NextRequest, NextResponse } from 'next/server';
import { handleSTKPushCallback, handleB2CCallback, handleB2BCallback, handleB2PochiCallback, handleC2BConfirmation, handleC2BValidation, handleTransactionStatusCallback, handleAccountBalanceCallback, handleReversalCallback } from '@/lib/mpesa-service';

type CallbackResult = {
  success: boolean;
  error?: string;
  message?: string;
  transactionId?: string;
  status?: string;
  balanceInfo?: string;
};

type ValidationResult = {
  ResultCode: number;
  ResultDesc: string;
  ThirdPartyTransID: string;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params;
    const callbackType = slug[0];
    
    if (!callbackType) {
      return NextResponse.json({
        ResultCode: 1,
        ResultDesc: 'Missing callback type',
        ThirdPartyTransID: null
      });
    }
    
    const body = await req.json();

    let result: CallbackResult | ValidationResult;
    
    if (callbackType === 'c2b-validation') {
      result = await handleC2BValidation(body) as ValidationResult;
      return NextResponse.json(result);
    }
    
    switch (callbackType) {
      case 'stkpush':
        result = await handleSTKPushCallback(body) as CallbackResult;
        break;
      case 'b2c':
        result = await handleB2CCallback(body) as CallbackResult;
        break;
      case 'b2b':
        result = await handleB2BCallback(body) as CallbackResult;
        break;
      case 'b2pochi':
        result = await handleB2PochiCallback(body) as CallbackResult;
        break;
      case 'c2b':
        result = await handleC2BConfirmation(body) as CallbackResult;
        break;
      case 'transaction-status':
        result = await handleTransactionStatusCallback(body) as CallbackResult;
        break;
      case 'account-balance':
        result = await handleAccountBalanceCallback(body) as CallbackResult;
        break;
      case 'reversal':
        result = await handleReversalCallback(body) as CallbackResult;
        break;
      default:
        return NextResponse.json({
          ResultCode: 1,
          ResultDesc: 'Unknown callback type',
          ThirdPartyTransID: null
        });
    }

    const callbackResult = result as CallbackResult;
    
    if (callbackResult.success) {
      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: 'Success',
        ThirdPartyTransID: callbackResult.transactionId || null
      });
    } else {
      return NextResponse.json({
        ResultCode: 1,
        ResultDesc: callbackResult.error || 'Callback processing failed',
        ThirdPartyTransID: callbackResult.transactionId || null
      });
    }
  } catch (error: any) {
    console.error('Callback processing error:', error);
    return NextResponse.json({
      ResultCode: 1,
      ResultDesc: 'Internal server error',
      ThirdPartyTransID: null
    }, { status: 500 });
  }
}