import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';
import { PAYOUT_CHANNELS, PayoutChannel } from '@/lib/payout-beneficiary-service';

async function findOwnedBeneficiary(id: string, contractorId?: string | null) {
  return contractorId
    ? prisma.payoutBeneficiary.findFirst({ where: { id, contractorId } })
    : prisma.payoutBeneficiary.findUnique({ where: { id } });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequirePermission(request, 'wallets:manage');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await findOwnedBeneficiary(id, permCheck.contractorId);
    if (!existing) {
      return mobileError('Beneficiary not found', 404);
    }

    if (body.channel && !PAYOUT_CHANNELS.includes(body.channel as PayoutChannel)) {
      return mobileError('Invalid payout channel', 400);
    }

    const beneficiary = await prisma.payoutBeneficiary.update({
      where: { id },
      data: {
        label: body.label ?? existing.label,
        channel: body.channel ?? existing.channel,
        destination: body.destination ?? existing.destination,
        accountRef: body.accountRef ?? existing.accountRef,
        bankCode: body.bankCode ?? existing.bankCode,
        recipientName: body.recipientName ?? existing.recipientName,
        isFavorite: body.isFavorite ?? existing.isFavorite,
      },
    });

    return mobileSuccess(beneficiary, 'Beneficiary updated');
  } catch (error: any) {
    console.error('Mobile update payout beneficiary error:', error);
    return mobileError(error.message || 'Failed to update payout beneficiary', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequirePermission(request, 'wallets:manage');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const { id } = await params;

    const existing = await findOwnedBeneficiary(id, permCheck.contractorId);
    if (!existing) {
      return mobileError('Beneficiary not found', 404);
    }

    await prisma.payoutBeneficiary.delete({ where: { id } });

    return mobileSuccess({ success: true }, 'Beneficiary deleted');
  } catch (error: any) {
    console.error('Mobile delete payout beneficiary error:', error);
    return mobileError(error.message || 'Failed to delete payout beneficiary', 500);
  }
}
