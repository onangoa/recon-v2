import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequirePermission(request, 'inventory:update');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const { id } = await params;
    const body = await request.json();
    const { quantity, notes } = body;

    if (!quantity || quantity <= 0) {
      return mobileError('Valid quantity is required', 400);
    }

    const inventory = await prisma.inventory.findUnique({
      where: { id },
    });

    if (!inventory) {
      return mobileError('Inventory item not found', 404);
    }

    if (inventory.quantity < quantity) {
      return mobileError('Insufficient stock', 400);
    }

    const newQuantity = inventory.quantity - quantity;
    const updatedInventory = await prisma.inventory.update({
      where: { id },
      data: {
        quantity: newQuantity,
      },
      include: {
        site: true,
      },
    });

    await prisma.stockMovement.create({
      data: {
        inventoryId: id,
        quantity: newQuantity,
        change: -quantity,
        type: 'out',
        notes: notes || 'Usage recorded',
      },
    });

    return mobileSuccess(updatedInventory, 'Usage recorded');
  } catch (error) {
    console.error('Mobile usage error:', error);
    return mobileError('Failed to record usage', 500);
  }
}
