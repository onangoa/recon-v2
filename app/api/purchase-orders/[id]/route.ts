import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

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
        site: true,
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
            deleteMany: {},
            create: items.map((item: any) => ({
              description: item.description,
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || 0,
              totalPrice: (item.quantity || 1) * (item.unitPrice || 0),
              id: item.id || null,
            }))
          } : undefined,
        },
        include: {
          items: true,
          supplier: true,
          site: true,
        }
      });

      // 2. If status just transitioned to "completed", update the associated materials
      if (currentPO.status !== 'delivered' && updatedPO.status === 'delivered') {
        for (const item of updatedPO.items) {
          if (item.materialId) {
            const material = await tx.inventory.findUnique({
              where: { id: item.materialId }
            });

            if (material) {
              const newQuantity = material.quantity + item.quantity;
              
              // Update material stock
              await tx.inventory.update({
                where: { id: item.materialId },
                data: {
                  quantity: newQuantity,
                  unitCost: item.unitPrice,
                  status: 'in-stock',
                  updatedAt: new Date(),
                }
              });

              // Record stock movement
              await tx.stockMovement.create({
                data: {
                  inventoryId: item.materialId,
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

    if (result.site) {
      await ActivityLogger.log({
        userId: 'system',
        contractorId: result.site.contractorId,
        action: 'UPDATE',
        module: 'PURCHASE_ORDERS',
        description: `Updated purchase order: ${result.orderNumber}`,
        targetId: result.id,
        details: { orderNumber: result.orderNumber, status: result.status, total: result.total }
      });
    }

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
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { site: true }
    });

    if (purchaseOrder && purchaseOrder.site) {
      await ActivityLogger.log({
        userId: 'system',
        contractorId: purchaseOrder.site.contractorId,
        action: 'DELETE',
        module: 'PURCHASE_ORDERS',
        description: `Deleted purchase order: ${purchaseOrder.orderNumber}`,
        targetId: purchaseOrder.id,
        details: { orderNumber: purchaseOrder.orderNumber }
      });
    }

    await prisma.purchaseOrder.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    console.error('Failed to delete purchase order:', error);
    return NextResponse.json({ error: 'Failed to delete purchase order' }, { status: 500 });
  }
}
