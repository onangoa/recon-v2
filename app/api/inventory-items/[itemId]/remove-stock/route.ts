import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { itemId } = await params;

  const body = await request.json();
  const { quantity, notes } = body;

  if (!quantity || quantity <= 0) return mobileError('Quantity must be positive', 400);

  const item = await prisma.inventory.findUnique({ where: { id: itemId } });
  if (!item) return mobileError('Item not found', 404);
  if (item.quantity < quantity) return mobileError('Insufficient stock', 400);

  const updated = await prisma.inventory.update({
    where: { id: itemId },
    data: { quantity: { decrement: quantity } },
  });

  await prisma.stockMovement.create({
    data: {
      inventoryId: itemId,
      quantity: updated.quantity,
      change: -quantity,
      type: 'out',
      notes: notes || 'Stock removed',
    },
  });

  return mobileSuccess({ id: updated.id, quantity: updated.quantity }, 'Stock removed successfully');
}