import { NextRequest } from 'next/server';
import { checkAccountBalance } from '@/lib/mpesa-service';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function POST(req: NextRequest) {
  const permCheck = await mobileRequirePermission(req, 'wallets:read');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const body = await req.json();
    const {
      remarks = 'Balance Query',
      walletId
    } = body;

    const result = await checkAccountBalance(
      remarks,
      walletId
    );

    if (result.success) {
      return mobileSuccess({
        responseCode: result.responseCode,
        responseDescription: result.responseDescription,
        result: result.result,
        transactionId: result.transactionId
      }, 'Account balance retrieved successfully');
    } else {
      return mobileError(result.responseDescription, 400);
    }

  } catch (error: any) {
    console.error('Mobile account balance error:', error);
    return mobileError('Failed to query account balance', 500);
  }
}
