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
  const { quantity, cost, notes } = body;

  if (!quantity || quantity <= 0) {
    return Response.json({ success: false, message: 'Insufficient stock for this operation.' }, { status: 200 });
  }

  const item = await prisma.inventory.findUnique({ where: { id: itemId } });
  if (!item) return Response.json({ success: false, message: 'Item not found' }, { status: 404 });

  const updated = await prisma.inventory.update({
    where: { id: itemId },
    data: { quantity: { increment: quantity } },
  });

  await prisma.stockMovement.create({
    data: {
      inventoryId: itemId,
      quantity: updated.quantity,
      change: quantity,
      type: 'in',
      notes: notes || 'Stock added',
    },
  });

  return Response.json({
    success: true,
    message: 'Stock added successfully.',
    inventory_item: { id: updated.id, name: updated.name, quantity: updated.quantity },
  });
}