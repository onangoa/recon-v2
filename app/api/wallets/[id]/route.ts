import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const wallet = await prisma.wallet.findUnique({
      where: { id: resolvedParams.id },
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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json({ error: 'Wallet name is required' }, { status: 400 });
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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    
    const wallet = await prisma.wallet.findUnique({
      where: { id: resolvedParams.id },
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