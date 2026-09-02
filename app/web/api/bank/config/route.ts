import { NextRequest, NextResponse } from 'next/server';
import { requireContractorPermission } from '@/lib/require-permission';

export async function GET(request: NextRequest) {
  const permCheck = await requireContractorPermission(request, 'wallets:read');
  if (!permCheck.authorized) return permCheck.error;

  return NextResponse.json({
    bankName: 'Co-operative Bank of Kenya (RECON ENGINEERING ..)',
    sourceAccount: process.env.COOP_BANK_SOURCE_ACCOUNT || '',
  });
}
