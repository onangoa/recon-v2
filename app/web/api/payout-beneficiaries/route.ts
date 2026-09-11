import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';
import { savePayoutBeneficiary, getRecentPayoutRecipients } from '@/lib/payout-beneficiary-service';

export async function GET(request: NextRequest) {
  const permCheck = await requirePermission(request, 'wallets:read');
  if (!permCheck.authorized) return permCheck.error;
  try {
    if (!permCheck.contractorId) {
      return NextResponse.json({ beneficiaries: [], recent: [] });
    }

    const [beneficiaries, recent] = await Promise.all([
      prisma.payoutBeneficiary.findMany({
        where: { contractorId: permCheck.contractorId },
        orderBy: [{ isFavorite: 'desc' }, { usageCount: 'desc' }, { createdAt: 'desc' }],
      }),
      getRecentPayoutRecipients(permCheck.contractorId),
    ]);

    const savedKeys = new Set(
      beneficiaries.map((b) => `${b.channel}|${b.destination.replace(/\s/g, '')}`)
    );

    return NextResponse.json({
      beneficiaries,
      recent: recent.map((r) => ({
        ...r,
        saved: savedKeys.has(`${r.channel}|${r.destination.replace(/\s/g, '')}`),
      })),
    });
  } catch (error) {
    console.error('Failed to fetch payout beneficiaries:', error);
    return NextResponse.json({ error: 'Failed to fetch payout beneficiaries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const permCheck = await requirePermission(request, 'wallets:create');
  if (!permCheck.authorized) return permCheck.error;
  try {
    if (!permCheck.contractorId) {
      return NextResponse.json({ error: 'Contractor account required' }, { status: 403 });
    }

    const body = await request.json();
    if (!body.channel || !body.destination) {
      return NextResponse.json({ error: 'Channel and destination are required' }, { status: 400 });
    }

    const beneficiary = await savePayoutBeneficiary(permCheck.contractorId, {
      channel: body.channel,
      destination: body.destination,
      label: body.label || null,
      accountRef: body.accountRef || null,
      bankCode: body.bankCode || null,
      recipientName: body.recipientName || null,
      isFavorite: body.isFavorite ?? false,
    });

    return NextResponse.json(beneficiary);
  } catch (error: any) {
    console.error('Failed to save payout beneficiary:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save payout beneficiary' },
      { status: 500 }
    );
  }
}
