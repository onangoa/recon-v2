import { NextRequest, NextResponse } from 'next/server';
import { getMiniStatement } from '@/lib/bank-service';
import { requirePermission } from '@/lib/require-permission';

export async function POST(request: NextRequest) {
  const permCheck = await requirePermission(request, 'wallets:read');
  if (!permCheck.authorized) return permCheck.error;

  try {
    const body = await request.json().catch(() => ({}));
    const { accountNumber } = body || {};

    const result = await getMiniStatement({ accountNumber });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Bank mini-statement error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch mini statement' },
      { status: 500 }
    );
  }
}