import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequireContractorPermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'wallets:read');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const resolvedParams = await params;
    const wallet = await prisma.wallet.findFirst({
      where: { id: resolvedParams.id, contractorId },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!wallet) {
      return mobileError('Wallet not found', 404);
    }

    return mobileSuccess(wallet);
  } catch (error) {
    console.error('Mobile fetch wallet error:', error);
    return mobileError('Failed to fetch wallet', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'wallets:update');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const resolvedParams = await params;
    const body = await request.json();

    if (!body.name) {
      return mobileError('Wallet name is required', 400);
    }

    const existing = await prisma.wallet.findFirst({
      where: { id: resolvedParams.id, contractorId },
    });
    if (!existing) {
      return mobileError('Wallet not found', 404);
    }

    const wallet = await prisma.wallet.update({
      where: { id: resolvedParams.id },
      data: {
        name: body.name,
        description: body.description,
        supportedPaymentOptions: Array.isArray(body.supportedPaymentOptions)
          ? body.supportedPaymentOptions.join(',')
          : (body.supportedPaymentOptions || null),
        dailySpendLimit: body.dailySpendLimit != null ? Number(body.dailySpendLimit) : null,
      },
    });

    return mobileSuccess(wallet, 'Wallet updated');
  } catch (error) {
    console.error('Mobile update wallet error:', error);
    return mobileError('Failed to update wallet', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'wallets:delete');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const resolvedParams = await params;

    const wallet = await prisma.wallet.findFirst({
      where: { id: resolvedParams.id, contractorId },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!wallet) {
      return mobileError('Wallet not found', 404);
    }

    if (wallet._count.transactions > 0) {
      return mobileError('Cannot delete wallet with existing transactions', 400);
    }

    await prisma.wallet.delete({
      where: { id: resolvedParams.id },
    });

    return mobileSuccess(null, 'Wallet deleted');
  } catch (error) {
    console.error('Mobile delete wallet error:', error);
    return mobileError('Failed to delete wallet', 500);
  }
}
