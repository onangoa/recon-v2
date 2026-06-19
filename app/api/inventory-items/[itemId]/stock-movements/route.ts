import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { itemId } = await params;

  const movements = await prisma.stockMovement.findMany({
    where: { inventoryId: itemId },
    orderBy: { createdAt: 'desc' },
  });

  return mobileSuccess(movements.map(m => ({
    id: m.id,
    type: m.type,
    quantity: m.quantity,
    change: m.change,
    notes: m.notes,
    created_at: m.createdAt,
  })));
}