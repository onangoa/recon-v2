import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requirePermission(request, 'inventory:update');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const { id } = await params;
    const body = await request.json();
    const { quantity, notes } = body;

    if (!quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Valid quantity is required' }, { status: 400 });
    }

    const inventory = await prisma.inventory.findUnique({
      where: { id },
    });

    if (!inventory) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }

    const newQuantity = inventory.quantity + quantity;
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
        change: quantity,
        type: 'in',
        notes: notes || 'Stock added',
      },
    });

    return NextResponse.json(updatedInventory);
  } catch (error) {
    console.error('Failed to record stock in:', error);
    return NextResponse.json({ error: 'Failed to record stock in' }, { status: 500 });
  }
}