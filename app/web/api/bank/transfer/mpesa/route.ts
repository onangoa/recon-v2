import { NextRequest, NextResponse } from 'next/server';
import { sendB2CMpesa } from '@/lib/bank-service';
import { requirePermission } from '@/lib/require-permission';

export async function POST(request: NextRequest) {
  const permCheck = await requirePermission(request, 'wallets:manage');
  if (!permCheck.authorized) return permCheck.error;

  try {
    const body = await request.json();
    const { sourceAccountNumber, destinations, userId, callBackUrl, iso2CountryCode, amount, narration } = body;

    if (!destinations || !Array.isArray(destinations) || destinations.length === 0) {
      return NextResponse.json({ error: 'destinations array is required' }, { status: 400 });
    }

    const result = await sendB2CMpesa({
      sourceAccountNumber,
      destinations,
      userId,
      callBackUrl,
      iso2CountryCode,
      amount,
      narration,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('B2C M-Pesa send error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send B2C M-Pesa transfer' },
      { status: 500 }
    );
  }
}