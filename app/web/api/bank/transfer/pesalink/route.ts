import { NextRequest, NextResponse } from 'next/server';
import { sendPesalink } from '@/lib/bank-service';
import { requirePermission } from '@/lib/require-permission';

export async function POST(request: NextRequest) {
  const permCheck = await requirePermission(request, 'wallets:manage');
  if (!permCheck.authorized) return permCheck.error;

  try {
    const body = await request.json();
    const { sourceAccountNumber, destinations, userId, callBackUrl, iso2CountryCode, amount } = body;

    if (!destinations || !Array.isArray(destinations) || destinations.length === 0) {
      return NextResponse.json({ error: 'destinations array is required' }, { status: 400 });
    }

    const result = await sendPesalink({
      sourceAccountNumber,
      destinations,
      userId,
      callBackUrl,
      iso2CountryCode,
      amount,
      narration: body.narration || 'Wallet Payout',
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('PesaLink send error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send PesaLink transfer' },
      { status: 500 }
    );
  }
}