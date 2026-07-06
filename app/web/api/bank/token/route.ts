import { NextRequest, NextResponse } from 'next/server';
import { getBankToken } from '@/lib/bank-service';
import { requirePermission } from '@/lib/require-permission';

export async function POST(request: NextRequest) {
  const permCheck = await requirePermission(request, 'wallets:read');
  if (!permCheck.authorized) return permCheck.error;

  try {
    const token = await getBankToken();
    return NextResponse.json({ access_token: token, token_type: 'Bearer' });
  } catch (error: any) {
    console.error('Bank token generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate Co-op Bank token' },
      { status: 500 }
    );
  }
}