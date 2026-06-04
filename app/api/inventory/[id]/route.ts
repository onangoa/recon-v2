import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });
    if (!inventoryItem) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }
    return NextResponse.json(inventoryItem);
  } catch (error) {
    console.error('Failed to fetch inventory item:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory item' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Calculate total price if unitPrice and quantity are provided
    const unitPrice = body.unitPrice ? parseFloat(body.unitPrice) : undefined;
    const quantity = body.quantity !== undefined ? parseInt(body.quantity) : undefined;
    
    const updateData: any = {
      name: body.name,
      description: body.description,
      sku: body.sku,
      barcode: body.barcode,
      categoryId: body.categoryId,
      unit: body.unit,
      quantity: quantity,
      minStockLevel: body.minStockLevel !== undefined ? parseInt(body.minStockLevel) : undefined,
      maxStockLevel: body.maxStockLevel !== undefined ? (body.maxStockLevel ? parseInt(body.maxStockLevel) : null) : undefined,
      reorderPoint: body.reorderPoint !== undefined ? parseInt(body.reorderPoint) : undefined,
      unitPrice: unitPrice,
      location: body.location,
      supplierId: body.supplierId,
      notes: body.notes,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    if (unitPrice !== undefined || quantity !== undefined) {
      // We need the current values if one is missing
      const currentItem = await prisma.inventoryItem.findUnique({
        where: { id }
      });
      if (currentItem) {
        const finalPrice = unitPrice !== undefined ? unitPrice : currentItem.unitPrice;
        const finalQuantity = quantity !== undefined ? quantity : currentItem.quantity;
        updateData.totalPrice = finalPrice * finalQuantity;
      }
    }

    const inventoryItem = await prisma.inventoryItem.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });

    return NextResponse.json(inventoryItem);
  } catch (error) {
    console.error('Failed to update inventory item:', error);
    return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.inventoryItem.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Inventory item deleted' });
  } catch (error) {
    console.error('Failed to delete inventory item:', error);
    return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 });
  }
}
