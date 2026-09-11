import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';
import { PAYOUT_CHANNELS, PayoutChannel } from '@/lib/payout-beneficiary-service';

async function findOwnedBeneficiary(id: string, contractorId?: string) {
  return contractorId
    ? prisma.payoutBeneficiary.findFirst({ where: { id, contractorId } })
    : prisma.payoutBeneficiary.findUnique({ where: { id } });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requirePermission(request, 'wallets:create');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await findOwnedBeneficiary(id, permCheck.contractorId);
    if (!existing) {
      return NextResponse.json({ error: 'Beneficiary not found' }, { status: 404 });
    }

    if (body.channel && !PAYOUT_CHANNELS.includes(body.channel as PayoutChannel)) {
      return NextResponse.json({ error: 'Invalid payout channel' }, { status: 400 });
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

    return NextResponse.json(beneficiary);
  } catch (error) {
    console.error('Failed to update payout beneficiary:', error);
    return NextResponse.json({ error: 'Failed to update payout beneficiary' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requirePermission(request, 'wallets:create');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const { id } = await params;

    const existing = await findOwnedBeneficiary(id, permCheck.contractorId);
    if (!existing) {
      return NextResponse.json({ error: 'Beneficiary not found' }, { status: 404 });
    }

    await prisma.payoutBeneficiary.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete payout beneficiary:', error);
    return NextResponse.json({ error: 'Failed to delete payout beneficiary' }, { status: 500 });
  }
}
