import { NextRequest, NextResponse } from 'next/server';
import { getFullStatement } from '@/lib/bank-service';
import { requirePermission } from '@/lib/require-permission';

export async function POST(request: NextRequest) {
  const permCheck = await requirePermission(request, 'wallets:read');
  if (!permCheck.authorized) return permCheck.error;

  try {
    const body = await request.json();
    const { accountNumber, startDate, endDate, userId, iso2CountryCode } = body;

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required (YYYY-MM-DD)' }, { status: 400 });
    }

    const result = await getFullStatement({
      accountNumber,
      startDate,
      endDate,
      userId,
      iso2CountryCode,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Bank full statement error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch account statement' },
      { status: 500 }
    );
  }
}