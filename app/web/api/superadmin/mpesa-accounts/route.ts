import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadmin } from '@/lib/require-permission';
import {
  checkAccountBalance,
  getLatestAccountBalanceQuery,
  resolveMpesaSystemWallet,
  MPESA_SHORTCODE,
  MPESA_ENVIRONMENT,
} from '@/lib/mpesa-service';

// Latest stored M-Pesa account balances (all org accounts: working, utility,
// charges paid, merchant, settlement, loan, etc.) for the platform shortcode.
export async function GET(request: NextRequest) {
  const adminCheck = await requireSuperadmin(request);
  if (!adminCheck.authorized) return adminCheck.error;

  const latest = await getLatestAccountBalanceQuery();
  return NextResponse.json({
    shortcode: MPESA_SHORTCODE,
    environment: MPESA_ENVIRONMENT,
    latest,
  });
}

// Initiate a fresh AccountBalance query. The actual balances arrive
// asynchronously from Daraja via the result callback; the client polls GET
// until the query transaction resolves.
export async function POST(request: NextRequest) {
  const adminCheck = await requireSuperadmin(request);
  if (!adminCheck.authorized) return adminCheck.error;

  try {
    const wallet = await resolveMpesaSystemWallet();
    const result = await checkAccountBalance('M-Pesa account balance query', wallet.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.responseDescription || 'Daraja rejected the balance query' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      transactionId: result.transactionId,
      responseDescription: result.responseDescription,
    });
  } catch (error: any) {
    console.error('M-Pesa account balance query error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to query M-Pesa account balances' },
      { status: 500 }
    );
  }
}
