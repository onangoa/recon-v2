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

export async function POST(
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
    const { items, note } = body as {
      items: Array<{ id: string; receivedQuantity: number }>;
      note?: string;
    };

    if (!Array.isArray(items) || items.length === 0) {
      return mobileError('No items provided', 400);
    }

    const hasAccess = await verifyContractorAccess(contractorId, 'purchase-order', id);
    if (!hasAccess) {
      return mobileError('Purchase order not found', 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { items: true, site: { select: { contractorId: true } } },
      });

      if (!po || po.site.contractorId !== contractorId) {
        throw new Error('Purchase order not found');
      }

      if (po.status === 'delivered') {
        throw new Error('This purchase order is already fully received');
      }

      const updatedItemIds: string[] = [];

      for (const incoming of items) {
        const item = po.items.find((i) => i.id === incoming.id);
        if (!item) continue;

        const newReceived = Math.max(0, Number(incoming.receivedQuantity) || 0);
        const prevReceived = item.receivedQuantity || 0;
        const delta = newReceived - prevReceived;

        if (delta === 0) continue;

        updatedItemIds.push(item.id);

        if (item.materialId) {
          const material = await tx.inventory.findUnique({
            where: { id: item.materialId },
          });

          if (material) {
            const newQuantity = material.quantity + delta;
            await tx.inventory.update({
              where: { id: item.materialId },
              data: {
                quantity: newQuantity,
                unitCost: item.unitPrice,
                status: newQuantity > 0 ? 'in-stock' : 'out-of-stock',
                updatedAt: new Date(),
              },
            });

            await tx.stockMovement.create({
              data: {
                inventoryId: item.materialId,
                quantity: newQuantity,
                change: delta,
                type: delta > 0 ? 'in' : 'adjustment',
                notes:
                  delta > 0
                    ? `Received from PO: ${po.orderNumber}${note ? ` - ${note}` : ''}`
                    : `Stock receipt correction: PO ${po.orderNumber}${note ? ` - ${note}` : ''}`,
              },
            });
          }
        }

        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: { receivedQuantity: newReceived },
        });
      }

      const refreshed = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { items: true },
      });

      let newStatus = refreshed!.status;
      const allReceived = refreshed!.items.every(
        (i) => (i.receivedQuantity || 0) >= i.quantity
      );
      const anyReceived = refreshed!.items.some((i) => (i.receivedQuantity || 0) > 0);

      if (allReceived) {
        newStatus = 'delivered';
      } else if (anyReceived) {
        newStatus = 'partially_received';
      }

      const updatedPO = await tx.purchaseOrder.update({
        where: { id },
        data: { status: newStatus },
        include: { items: true, supplier: true, site: true },
      });

      return { updatedPO, updatedItemIds };
    });

    await ActivityLogger.log({
      userId: permCheck.userId!,
      contractorId: contractorId,
      action: 'UPDATE',
      module: 'PURCHASE_ORDERS',
      description: `Recorded stock received for purchase order: ${result.updatedPO.orderNumber}`,
      targetId: result.updatedPO.id,
      details: {
        orderNumber: result.updatedPO.orderNumber,
        status: result.updatedPO.status,
        updatedItems: result.updatedItemIds.length,
      },
    });

    if (result.updatedPO.status === 'delivered') {
      const contractor = await prisma.contractor.findUnique({
        where: { id: contractorId },
        select: { userId: true },
      });

      if (contractor?.userId) {
        await NotificationService.send({
          userId: contractor.userId,
          contractorId,
          title: 'Purchase Order Delivered',
          message: `PO ${result.updatedPO.orderNumber} from ${result.updatedPO.supplier?.name || 'supplier'} has been delivered. All items have been received.`,
          type: 'orders',
          link: `/contractor/purchase-orders/${result.updatedPO.id}`,
        });
      }
    }

    return mobileSuccess(result.updatedPO, 'Stock received recorded');
  } catch (error: any) {
    console.error('Mobile receive stock error:', error);
    return mobileError(error?.message || 'Failed to record stock received', 500);
  }
}
