import { NextRequest } from 'next/server';
import { mobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const { itemId } = await params;

  const body = await request.json();
  const { quantity, notes } = body;

  if (!quantity || quantity <= 0) {
    return Response.json({ success: false, message: 'Insufficient stock for this operation.' }, { status: 200 });
  }

  const item = await prisma.inventory.findUnique({ where: { id: itemId } });
  if (!item) return Response.json({ success: false, message: 'Item not found' }, { status: 404 });
  if (item.quantity < quantity) {
    return Response.json({ success: false, message: 'Insufficient stock for this operation.' }, { status: 200 });
  }

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

  return Response.json({
    success: true,
    message: 'Stock removed successfully.',
    inventory_item: { id: updated.id, name: updated.name, quantity: updated.quantity },
  });
}