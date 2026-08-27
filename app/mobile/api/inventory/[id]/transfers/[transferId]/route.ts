import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequirePermission(request, 'inventory:update');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const { id } = await params;
    const body = await request.json();

    const transfer = await prisma.stockTransfer.findUnique({
      where: { id },
      include: {
        inventory: true,
      },
    });

    if (!transfer) {
      return mobileError('Transfer not found', 404);
    }

    if (transfer.status !== 'pending') {
      return mobileError('Transfer is not in pending status', 400);
    }

    if (body.status === 'approved') {
      const fromInventory = await prisma.inventory.findUnique({
        where: { id: transfer.inventoryId },
      });

      if (!fromInventory || fromInventory.quantity < transfer.quantity) {
        return mobileError('Insufficient stock for transfer', 400);
      }

      await prisma.$transaction(async (tx) => {
        await tx.inventory.update({
          where: { id: transfer.inventoryId },
          data: {
            quantity: {
              decrement: transfer.quantity,
            },
          },
        });

        let toInventory = await tx.inventory.findFirst({
          where: {
            siteId: transfer.toSiteId,
            name: transfer.inventory.name,
          },
        });

        if (toInventory) {
          await tx.inventory.update({
            where: { id: toInventory.id },
            data: {
              quantity: {
                increment: transfer.quantity,
              },
            },
          });
        } else {
          toInventory = await tx.inventory.create({
            data: {
              siteId: transfer.toSiteId,
              contractorId: fromInventory?.contractorId,
              name: transfer.inventory.name,
              description: transfer.inventory.description,
              categoryId: transfer.inventory.categoryId,
              quantity: transfer.quantity,
              unit: transfer.inventory.unit,
              minStock: transfer.inventory.minStock,
              location: transfer.inventory.location,
              status: 'in-stock',
              productId: `${transfer.inventory.productId}-transfer-${Date.now()}`,
            },
          });
        }

        await tx.stockTransfer.update({
          where: { id },
          data: {
            status: 'approved',
            approvedBy: body.approvedBy || 'current-user',
            approvedAt: new Date(),
          },
        });
      });
    } else if (body.status === 'rejected') {
      await prisma.stockTransfer.update({
        where: { id },
        data: {
          status: 'rejected',
          rejectionReason: body.rejectionReason,
          approvedBy: body.approvedBy || 'current-user',
          approvedAt: new Date(),
        },
      });
    }

    const updatedTransfer = await prisma.stockTransfer.findUnique({
      where: { id },
      include: {
        fromSite: true,
        toSite: true,
        inventory: true,
      },
    });

    return mobileSuccess(updatedTransfer, 'Stock transfer updated');
  } catch (error) {
    console.error('Mobile update stock transfer error:', error);
    return mobileError('Failed to update stock transfer', 500);
  }
}
