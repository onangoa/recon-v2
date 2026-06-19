import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const contractorId = auth.contractorId || auth.companyId;
  if (!contractorId) return mobileError('No company associated', 403);

  const wallets = await prisma.wallet.findMany({
    where: { contractorId },
    include: { transactions: { orderBy: { createdAt: 'desc' }, take: 5 } },
    orderBy: { createdAt: 'desc' },
  });

  return mobileSuccess(wallets.map(w => ({
    id: w.id,
    name: w.name,
    description: w.description,
    balance: w.balance,
    currency: w.currency,
    status: w.status,
    created_at: w.createdAt,
    updated_at: w.updatedAt,
  })));
}

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const contractorId = auth.contractorId;
  if (!contractorId) return mobileError('No company associated', 403);

  const body = await request.json();

  const wallet = await prisma.wallet.create({
    data: {
      name: body.name,
      description: body.description || null,
      currency: body.currency || 'KES',
      contractorId,
    },
  });

  return mobileSuccess({
    id: wallet.id,
    name: wallet.name,
    balance: wallet.balance,
    currency: wallet.currency,
  }, 'Wallet created successfully');
}