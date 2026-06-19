import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requirePermission(request, 'inventory:update');
  if (!permCheck.authorized) return permCheck.error;
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
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    if (transfer.status !== 'pending') {
      return NextResponse.json({ error: 'Transfer is not in pending status' }, { status: 400 });
    }

    if (body.status === 'approved') {
      const fromInventory = await prisma.inventory.findUnique({
        where: { id: transfer.inventoryId },
      });

      if (!fromInventory || fromInventory.quantity < transfer.quantity) {
        return NextResponse.json({ error: 'Insufficient stock for transfer' }, { status: 400 });
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
              sku: `${transfer.inventory.sku}-transfer-${Date.now()}`,
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

    return NextResponse.json(updatedTransfer);
  } catch (error) {
    console.error('Failed to update stock transfer:', error);
    return NextResponse.json({ error: 'Failed to update stock transfer' }, { status: 500 });
  }
}