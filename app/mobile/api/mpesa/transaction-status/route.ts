import { NextRequest } from 'next/server';
import { checkTransactionStatus, getTransaction } from '@/lib/mpesa-service';
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
      transactionID,
      remarks = 'Status Query',
      walletId
    } = body;

    if (!transactionID) {
      return mobileError('Missing required field: transactionID', 400);
    }

    const result = await checkTransactionStatus(
      transactionID,
      remarks,
      walletId
    );

    if (result.success) {
      return mobileSuccess({
        responseCode: result.responseCode,
        responseDescription: result.responseDescription,
        result: result.result,
        transactionId: result.transactionId
      }, 'Transaction status retrieved successfully');
    } else {
      return mobileError(result.responseDescription, 400);
    }

  } catch (error: any) {
    console.error('Mobile transaction status error:', error);
    return mobileError('Failed to query transaction status', 500);
  }
}

export async function GET(req: NextRequest) {
  const permCheck = await mobileRequirePermission(req, 'wallets:read');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return mobileError('Missing required parameter: transactionId', 400);
    }

    const transaction = await getTransaction(transactionId);

    if (!transaction) {
      return mobileError('Transaction not found', 404);
    }

    return mobileSuccess(transaction);

  } catch (error: any) {
    console.error('Mobile get transaction error:', error);
    return mobileError('Failed to retrieve transaction', 500);
  }
}
