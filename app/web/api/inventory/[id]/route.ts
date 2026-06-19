import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requirePermission(request, 'inventory:read');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const { id } = await params;
    const inventory = await prisma.inventory.findUnique({
      where: { id },
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
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }
    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Failed to fetch inventory item:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory item' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requirePermission(request, 'inventory:update');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const { id } = await params;
    const body = await request.json();
    
    const quantity = body.quantity !== undefined ? parseFloat(body.quantity) : undefined;
    
    const currentInventory = await prisma.inventory.findUnique({
      where: { id },
    });

    if (!currentInventory) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }

    const updateData: any = {
      name: body.name,
      description: body.description,
      sku: body.sku,
      categoryId: body.categoryId,
      unit: body.unit,
      minStock: body.minStock !== undefined ? parseFloat(body.minStock) : undefined,
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

    return NextResponse.json(updatedInventory);
  } catch (error) {
    console.error('Failed to update inventory item:', error);
    return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requirePermission(request, 'inventory:delete');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const { id } = await params;
    await prisma.inventory.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Inventory item deleted' });
  } catch (error) {
    console.error('Failed to delete inventory item:', error);
    return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 });
  }
}