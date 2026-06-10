import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { quantity, notes } = body;

    if (!quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Valid quantity is required' }, { status: 400 });
    }

    const material = await prisma.material.findUnique({
      where: { id },
    });

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    if (material.quantity < quantity) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update material quantity and total cost
      const newQuantity = material.quantity - quantity;
      const updatedMaterial = await tx.material.update({
        where: { id },
        data: {
          quantity: newQuantity,
          totalCost: newQuantity * material.unitCost,
        },
      });

      // 2. Create stock movement record
      await tx.stockMovement.create({
        data: {
          materialId: id,
          quantity: newQuantity,
          change: -quantity,
          type: 'out',
          notes: notes || 'Usage recorded',
        },
      });

      return updatedMaterial;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to record usage:', error);
    return NextResponse.json({ error: 'Failed to record usage' }, { status: 500 });
  }
}
