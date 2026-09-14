import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperadmin } from '@/lib/require-permission';
import { getPayoutFee, PAYOUT_FEE_KEY, DEFAULT_PAYOUT_FEE } from '@/lib/payout-fee';

export async function GET(request: NextRequest) {
  const adminCheck = await requireSuperadmin(request);
  if (!adminCheck.authorized) return adminCheck.error;

  const payoutFee = await getPayoutFee();
  return NextResponse.json({ payoutFee, defaultPayoutFee: DEFAULT_PAYOUT_FEE });
}

export async function PUT(request: NextRequest) {
  const adminCheck = await requireSuperadmin(request);
  if (!adminCheck.authorized) return adminCheck.error;

  try {
    const body = await request.json();
    const { payoutFee } = body;
    const value = Number.parseFloat(payoutFee);

    if (!Number.isFinite(value) || value < 0) {
      return NextResponse.json(
        { error: 'payoutFee must be a number of 0 or more' },
        { status: 400 }
      );
    }

    await prisma.platformConfig.upsert({
      where: { key: PAYOUT_FEE_KEY },
      update: { value: String(value) },
      create: { key: PAYOUT_FEE_KEY, value: String(value) },
    });

    return NextResponse.json({ payoutFee: value });
  } catch (error) {
    console.error('Failed to update platform config:', error);
    return NextResponse.json({ error: 'Failed to update platform config' }, { status: 500 });
  }
}
