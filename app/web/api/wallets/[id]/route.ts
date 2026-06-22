import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireContractorPermission } from '@/lib/require-permission';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireContractorPermission(request, 'wallets:read');
  if (!permCheck.authorized) return permCheck.error;
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
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    return NextResponse.json(wallet);
  } catch (error) {
    console.error('Failed to fetch wallet:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireContractorPermission(request, 'wallets:update');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;
  try {
    const resolvedParams = await params;
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json({ error: 'Wallet name is required' }, { status: 400 });
    }

    const existing = await prisma.wallet.findFirst({
      where: { id: resolvedParams.id, contractorId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const wallet = await prisma.wallet.update({
      where: { id: resolvedParams.id },
      data: {
        name: body.name,
        description: body.description,
      },
    });

    return NextResponse.json(wallet);
  } catch (error) {
    console.error('Failed to update wallet:', error);
    return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireContractorPermission(request, 'wallets:delete');
  if (!permCheck.authorized) return permCheck.error;
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
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    if (wallet._count.transactions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete wallet with existing transactions' },
        { status: 400 }
      );
    }

    await prisma.wallet.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete wallet:', error);
    return NextResponse.json({ error: 'Failed to delete wallet' }, { status: 500 });
  }
}