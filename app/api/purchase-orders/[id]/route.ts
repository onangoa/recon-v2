import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { requirePermission } from '@/lib/require-permission';
import { verifyContractorAccess } from '@/lib/contractor-isolation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permCheck = await requirePermission(request, 'purchase_orders:read');
    if (!permCheck.authorized) return permCheck.error;

    const contractorId = permCheck.contractorId;
    if (!contractorId) {
      return NextResponse.json({ error: 'Contractor account required' }, { status: 403 });
    }

    const { id } = await params;

    const hasAccess = await verifyContractorAccess(contractorId, 'purchase-order', id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permCheck = await requirePermission(request, 'purchase_orders:update');
    if (!permCheck.authorized) return permCheck.error;

    const contractorId = permCheck.contractorId;
    if (!contractorId) {
      return NextResponse.json({ error: 'Contractor account required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { items, ...poData } = body;

    const hasAccess = await verifyContractorAccess(contractorId, 'purchase-order', id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!existingPO) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    if (existingPO.status === 'delivered') {
      return NextResponse.json({ error: 'Cannot edit a delivered purchase order' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const currentPO = await tx.purchaseOrder.findUnique({
        where: { id },
        select: { status: true, site: { select: { contractorId: true } } }
      });

      if (!currentPO || currentPO.site.contractorId !== contractorId) {
        throw new Error('Purchase order not found');
      }

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

      if (currentPO.status !== 'delivered' && updatedPO.status === 'delivered') {
        for (const item of updatedPO.items) {
          if (item.materialId) {
            const material = await tx.inventory.findUnique({
              where: { id: item.materialId }
            });

            if (material) {
              const newQuantity = material.quantity + item.quantity;
              
              await tx.inventory.update({
                where: { id: item.materialId },
                data: {
                  quantity: newQuantity,
                  unitCost: item.unitPrice,
                  status: 'in-stock',
                  updatedAt: new Date(),
                }
              });

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
        userId: permCheck.userId!,
        contractorId: contractorId,
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permCheck = await requirePermission(request, 'purchase_orders:delete');
    if (!permCheck.authorized) return permCheck.error;

    const contractorId = permCheck.contractorId;
    if (!contractorId) {
      return NextResponse.json({ error: 'Contractor account required' }, { status: 403 });
    }

    const { id } = await params;

    const hasAccess = await verifyContractorAccess(contractorId, 'purchase-order', id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { site: true }
    });

    if (!purchaseOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    if (purchaseOrder.status === 'delivered') {
      return NextResponse.json({ error: 'Cannot delete a delivered purchase order' }, { status: 400 });
    }

    if (purchaseOrder.site) {
      await ActivityLogger.log({
        userId: permCheck.userId!,
        contractorId: contractorId,
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