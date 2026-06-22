import { NextRequest } from 'next/server';
import { mobileAuth, mobileSuccessOk } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ walletId: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const { walletId } = await params;

  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
    include: { transactions: { orderBy: { createdAt: 'desc' }, take: 10 } },
  });
  if (!wallet) return Response.json({ success: false, message: 'Wallet not found' }, { status: 404 });

  return mobileSuccessOk({
    id: wallet.id,
    name: wallet.name,
    description: wallet.description,
    balance: wallet.balance,
    currency: wallet.currency,
    status: wallet.status,
    created_at: wallet.createdAt,
    updated_at: wallet.updatedAt,
    transactions: wallet.transactions.map(t => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      description: t.description,
      status: t.status,
      reference: t.reference,
      created_at: t.createdAt,
    })),
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ walletId: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const { walletId } = await params;

  const body = await request.json();
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (body.status !== undefined) data.status = body.status;

  try {
    const wallet = await prisma.wallet.update({ where: { id: walletId }, data });

    return Response.json({
      success: true,
      message: 'Wallet updated successfully.',
      data: {
        id: wallet.id,
        name: wallet.name,
        description: wallet.description,
        balance: wallet.balance,
        currency: wallet.currency,
        status: wallet.status,
      },
    });
  } catch {
    return Response.json({ success: false, message: 'Failed to update wallet. Please try again.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ walletId: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const { walletId } = await params;

  const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
  if (!wallet) return Response.json({ success: false, message: 'Wallet not found' }, { status: 404 });

  const transactionCount = await prisma.transaction.count({ where: { walletId } });
  if (transactionCount > 0) {
    // Mark as inactive instead of deleting
    await prisma.wallet.update({ where: { id: walletId }, data: { status: 'inactive' } });
    return Response.json({ success: false, message: 'Cannot delete wallet with existing transactions. Please delete all transactions first.' }, { status: 422 });
  }

  await prisma.wallet.delete({ where: { id: walletId } });
  return Response.json({ success: true, message: 'Wallet deleted successfully.' });
}