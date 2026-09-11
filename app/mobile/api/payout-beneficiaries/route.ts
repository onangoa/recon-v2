import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';
import { savePayoutBeneficiary, getRecentPayoutRecipients } from '@/lib/payout-beneficiary-service';

export async function GET(request: NextRequest) {
  const permCheck = await mobileRequirePermission(request, 'wallets:read');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    if (!permCheck.contractorId) {
      return mobileSuccess({ beneficiaries: [], recent: [] });
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

    return mobileSuccess({
      beneficiaries,
      recent: recent.map((r) => ({
        ...r,
        saved: savedKeys.has(`${r.channel}|${r.destination.replace(/\s/g, '')}`),
      })),
    });
  } catch (error: any) {
    console.error('Mobile fetch payout beneficiaries error:', error);
    return mobileError(error.message || 'Failed to fetch payout beneficiaries', 500);
  }
}

export async function POST(request: NextRequest) {
  const permCheck = await mobileRequirePermission(request, 'wallets:manage');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    if (!permCheck.contractorId) {
      return mobileError('Contractor account required', 403);
    }

    const body = await request.json();
    if (!body.channel || !body.destination) {
      return mobileError('Channel and destination are required', 400);
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

    return mobileSuccess(beneficiary, 'Beneficiary saved');
  } catch (error: any) {
    console.error('Mobile save payout beneficiary error:', error);
    return mobileError(error.message || 'Failed to save payout beneficiary', 500);
  }
}
