import { NextRequest } from 'next/server';
import { mobileAuth, mobileSuccessOk } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }

  const contractorId = auth.contractorId || auth.companyId;
  if (!contractorId) return Response.json({ success: false, message: 'No company selected.' }, { status: 400 });

  const wallets = await prisma.wallet.findMany({
    where: { contractorId },
    include: { transactions: { orderBy: { createdAt: 'desc' }, take: 5 } },
    orderBy: { createdAt: 'desc' },
  });

  return Response.json({
    total: wallets.length,
    rows: wallets.map(w => ({
      id: w.id,
      wallet_name: w.name,
      balance: String(w.balance),
      status: w.status,
      obj_status: w.status,
      site: null,
      created_by: null,
      created_at: w.createdAt,
      updated_at: w.updatedAt,
      has_transactions: w.transactions && w.transactions.length > 0,
      daily_spend_limit: null,
      supported_payment_options: ['mpesa', 'bank'],
      actions: '',
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }

  const contractorId = auth.contractorId;
  if (!contractorId) return Response.json({ success: false, message: 'No company selected.' }, { status: 400 });

  const body = await request.json();

  try {
    const wallet = await prisma.wallet.create({
      data: {
        name: body.name,
        description: body.description || null,
        currency: body.currency || 'KES',
        contractorId,
      },
    });

    return Response.json({
      success: true,
      message: 'Wallet created successfully.',
      data: {
        id: wallet.id,
        name: wallet.name,
        description: wallet.description,
        balance: wallet.balance,
        currency: wallet.currency,
        status: wallet.status,
        created_at: wallet.createdAt,
        updated_at: wallet.updatedAt,
      },
    });
  } catch (error: any) {
    return Response.json({
      success: false,
      message: `Failed to create wallet: ${error.message}`,
    }, { status: 500 });
  }
}