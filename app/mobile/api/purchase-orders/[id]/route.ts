import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { NotificationService } from '@/lib/notification-service';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';
import { verifyContractorAccess } from '@/lib/contractor-isolation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequirePermission(request, 'purchase_orders:read');
  if (!permCheck.authorized) return permCheck.error!;

  const contractorId = permCheck.contractorId;
  if (!contractorId) {
    return mobileError('Contractor account required', 403);
  }
  try {
    const { id } = await params;

    const hasAccess = await verifyContractorAccess(contractorId, 'purchase-order', id);
    if (!hasAccess) {
      return mobileError('Purchase order not found', 404);
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
      return mobileError('Purchase order not found', 404);
    }

    return mobileSuccess(purchaseOrder);
  } catch (error) {
    console.error('Mobile fetch purchase order error:', error);
    return mobileError('Failed to fetch purchase order', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequirePermission(request, 'purchase_orders:update');
  if (!permCheck.authorized) return permCheck.error!;

  const contractorId = permCheck.contractorId;
  if (!contractorId) {
    return mobileError('Contractor account required', 403);
  }
  try {
    const { id } = await params;
    const body = await request.json();
    const { items, ...poData } = body;

    const hasAccess = await verifyContractorAccess(contractorId, 'purchase-order', id);
    if (!hasAccess) {
      return mobileError('Purchase order not found', 404);
    }

    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!existingPO) {
      return mobileError('Purchase order not found', 404);
    }

    if (existingPO.status === 'delivered') {
      return mobileError('Cannot edit a delivered purchase order', 400);
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
          const alreadyReceived = item.receivedQuantity || 0;
          const remaining = Math.max(0, item.quantity - alreadyReceived);
          if (remaining <= 0) continue;

          if (item.materialId) {
            const material = await tx.inventory.findUnique({
              where: { id: item.materialId }
            });

            if (material) {
              const newQuantity = material.quantity + remaining;

              await tx.inventory.update({
                where: { id: item.materialId },
                data: {
                  quantity: newQuantity,
                  unitCost: item.unitPrice,
                  status: newQuantity > 0 ? 'in-stock' : 'out-of-stock',
                  updatedAt: new Date(),
                }
              });

              await tx.stockMovement.create({
                data: {
                  inventoryId: item.materialId,
                  quantity: newQuantity,
                  change: remaining,
                  type: 'in',
                  notes: `Received from PO: ${updatedPO.orderNumber}`,
                }
              });
            }
          }

          await tx.purchaseOrderItem.update({
            where: { id: item.id },
            data: { receivedQuantity: item.quantity },
          });
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

      if (existingPO.status !== 'delivered' && result.status === 'delivered') {
        await NotificationService.sendToContractor({
          contractorId,
          title: 'Purchase Order Delivered',
          message: `PO ${result.orderNumber} from ${result.supplier?.name || 'supplier'} has been delivered. All items have been received.`,
          type: 'orders',
          link: `/contractor/purchase-orders/${result.id}`,
          excludeUserId: permCheck.userId,
        });
      }
    }

    return mobileSuccess(result, 'Purchase order updated');
  } catch (error) {
    console.error('Mobile update purchase order error:', error);
    return mobileError('Failed to update purchase order', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequirePermission(request, 'purchase_orders:delete');
  if (!permCheck.authorized) return permCheck.error!;

  const contractorId = permCheck.contractorId;
  if (!contractorId) {
    return mobileError('Contractor account required', 403);
  }
  try {
    const { id } = await params;

    const hasAccess = await verifyContractorAccess(contractorId, 'purchase-order', id);
    if (!hasAccess) {
      return mobileError('Purchase order not found', 404);
    }

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { site: true }
    });

    if (!purchaseOrder) {
      return mobileError('Purchase order not found', 404);
    }

    if (purchaseOrder.status === 'delivered') {
      return mobileError('Cannot delete a delivered purchase order', 400);
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

    return mobileSuccess(null, 'Purchase order deleted successfully');
  } catch (error) {
    console.error('Mobile delete purchase order error:', error);
    return mobileError('Failed to delete purchase order', 500);
  }
}
