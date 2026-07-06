import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequireContractorPermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'inventory:read');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const inventory = await prisma.inventory.findFirst({
      where: { id, site: { contractorId } },
      include: {
        category: true,
        movements: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        site: {
          include: {
            contractor: true
          }
        },
      },
    });
    if (!inventory) {
      return mobileError('Inventory item not found', 404);
    }
    return mobileSuccess(inventory);
  } catch (error) {
    console.error('Mobile fetch inventory item error:', error);
    return mobileError('Failed to fetch inventory item', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'inventory:update');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const body = await request.json();

    const quantity = body.quantity !== undefined ? parseFloat(body.quantity) : undefined;

    const currentInventory = await prisma.inventory.findFirst({
      where: { id, site: { contractorId } },
    });

    if (!currentInventory) {
      return mobileError('Inventory item not found', 404);
    }

    const updateData: any = {
      name: body.name,
      description: body.description,
      sku: body.sku,
      categoryId: body.categoryId,
      unit: body.unit,
      unitCost: body.unitCost !== undefined ? parseFloat(body.unitCost) : undefined,
      minStock: (body.minStockLevel ?? body.minStock) !== undefined ? parseFloat(body.minStockLevel ?? body.minStock) : undefined,
      maxStockLevel: body.maxStockLevel != null && body.maxStockLevel !== '' ? parseFloat(body.maxStockLevel) : body.maxStockLevel === '' ? null : undefined,
      reorderPoint: body.reorderPoint != null && body.reorderPoint !== '' ? parseFloat(body.reorderPoint) : body.reorderPoint === '' ? null : undefined,
      location: body.location,
      status: body.status,
    };

    if (quantity !== undefined) updateData.quantity = quantity;

    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const updatedInventory = await prisma.inventory.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        site: {
          include: {
            contractor: true
          }
        },
      },
    });

    return mobileSuccess(updatedInventory, 'Inventory item updated');
  } catch (error) {
    console.error('Mobile update inventory item error:', error);
    return mobileError('Failed to update inventory item', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'inventory:delete');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const existing = await prisma.inventory.findFirst({
      where: { id, site: { contractorId } },
      select: { id: true }
    });
    if (!existing) {
      return mobileError('Inventory item not found', 404);
    }
    await prisma.inventory.delete({
      where: { id },
    });
    return mobileSuccess(null, 'Inventory item deleted');
  } catch (error) {
    console.error('Mobile delete inventory item error:', error);
    return mobileError('Failed to delete inventory item', 500);
  }
}
