import { NextRequest, NextResponse } from 'next/server';
import { getAccountBalance } from '@/lib/bank-service';
import { requirePermission } from '@/lib/require-permission';

export async function POST(request: NextRequest) {
  const permCheck = await requirePermission(request, 'wallets:read');
  if (!permCheck.authorized) return permCheck.error;

  try {
    const body = await request.json().catch(() => ({}));
    const { accountNumber, userId } = body || {};

    const result = await getAccountBalance({ accountNumber, userId });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Bank account balance error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch account balance' },
      { status: 500 }
    );
  }
}