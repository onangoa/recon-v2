import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: true,
      },
    });

    if (!purchaseOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    return NextResponse.json(purchaseOrder);
  } catch (error) {
    console.error('Failed to fetch purchase order:', error);
    return NextResponse.json({ error: 'Failed to fetch purchase order' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { items, ...poData } = body;

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 0. Get the current status to check for transitions
      const currentPO = await tx.purchaseOrder.findUnique({
        where: { id },
        select: { status: true }
      });

      if (!currentPO) {
        throw new Error('Purchase order not found');
      }

      // 1. Update the Purchase Order
      const updatedPO = await tx.purchaseOrder.update({
        where: { id },
        data: {
          ...poData,
          orderDate: poData.orderDate ? new Date(poData.orderDate) : undefined,
          expectedDeliveryDate: poData.expectedDeliveryDate ? new Date(poData.expectedDeliveryDate) : undefined,
          items: items ? {
            deleteMany: {}, // Simplest way to update items: delete and recreate
            create: items.map((item: any) => ({
              description: item.description,
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || 0,
              totalPrice: (item.quantity || 1) * (item.unitPrice || 0),
              materialId: item.materialId || null,
            }))
          } : undefined,
        },
        include: {
          items: true,
          supplier: true,
        }
      });

      // 2. If status just transitioned to "delivered", update the associated materials
      if (currentPO.status !== 'delivered' && updatedPO.status === 'delivered') {
        for (const item of updatedPO.items) {
          if (item.materialId) {
            const material = await tx.material.findUnique({
              where: { id: item.materialId }
            });

            if (material) {
              const newQuantity = material.quantity + item.quantity;
              
              // Update material stock
              await tx.material.update({
                where: { id: item.materialId },
                data: {
                  quantity: newQuantity,
                  totalCost: newQuantity * material.unitCost, // Keep total cost in sync
                  status: 'received',
                  updatedAt: new Date(),
                }
              });

              // Record stock movement
              await tx.stockMovement.create({
                data: {
                  materialId: item.materialId,
                  quantity: newQuantity,
                  change: item.quantity,
                  type: 'in',
                  notes: `Received from PO: ${updatedPO.orderNumber}`,
                }
              });
            }
          }
        }
      }

      return updatedPO;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to update purchase order:', error);
    return NextResponse.json({ error: 'Failed to update purchase order' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.purchaseOrder.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    console.error('Failed to delete purchase order:', error);
    return NextResponse.json({ error: 'Failed to delete purchase order' }, { status: 500 });
  }
}
