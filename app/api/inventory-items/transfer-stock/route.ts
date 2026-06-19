import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const body = await request.json();
  const { from_item_id, to_item_id, quantity, notes } = body;

  if (!from_item_id || !to_item_id || !quantity) {
    return mobileError('from_item_id, to_item_id, and quantity are required', 400);
  }

  const fromItem = await prisma.inventory.findUnique({ where: { id: from_item_id } });
  if (!fromItem) return mobileError('Source item not found', 404);
  if (fromItem.quantity < quantity) return mobileError('Insufficient stock', 400);

  await prisma.$transaction([
    prisma.inventory.update({ where: { id: from_item_id }, data: { quantity: { decrement: quantity } } }),
    prisma.inventory.update({ where: { id: to_item_id }, data: { quantity: { increment: quantity } } }),
  ]);

  await prisma.stockMovement.createMany({
    data: [
      { inventoryId: from_item_id, quantity: fromItem.quantity - quantity, change: -quantity, type: 'out', notes: notes || 'Transfer out' },
      { inventoryId: to_item_id, quantity: 0, change: quantity, type: 'in', notes: notes || 'Transfer in' },
    ],
  });

  return mobileSuccess(null, 'Stock transferred successfully');
}