import { NextRequest } from 'next/server';
import { mobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }

  const body = await request.json();
  const { from_item_id, to_item_id, quantity, notes } = body;

  if (!from_item_id || !to_item_id || !quantity) {
    return Response.json({ success: false, message: 'from_item_id, to_item_id, and quantity are required' }, { status: 400 });
  }

  const fromItem = await prisma.inventory.findUnique({ where: { id: from_item_id } });
  if (!fromItem) return Response.json({ success: false, message: 'Source item not found' }, { status: 404 });
  if (fromItem.quantity < quantity) {
    return Response.json({ success: false, message: 'Insufficient stock for this transfer.' }, { status: 200 });
  }

  const toItem = await prisma.inventory.findUnique({ where: { id: to_item_id } });
  if (!toItem) return Response.json({ success: false, message: 'Destination item not found' }, { status: 404 });

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

  const updatedFrom = await prisma.inventory.findUnique({ where: { id: from_item_id } });
  const updatedTo = await prisma.inventory.findUnique({ where: { id: to_item_id } });

  return Response.json({
    success: true,
    message: 'Stock transferred successfully.',
    from_item: { id: updatedFrom?.id, name: updatedFrom?.name, quantity: updatedFrom?.quantity },
    to_item: { id: updatedTo?.id, name: updatedTo?.name, quantity: updatedTo?.quantity },
  });
}