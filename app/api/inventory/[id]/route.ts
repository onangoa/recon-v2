import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        categoryRel: true,
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
    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }
    return NextResponse.json(material);
  } catch (error) {
    console.error('Failed to fetch material:', error);
    return NextResponse.json({ error: 'Failed to fetch material' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const quantity = body.quantity !== undefined ? parseFloat(body.quantity) : undefined;
    const unitCost = body.unitCost !== undefined ? parseFloat(body.unitCost) : undefined;
    
    const currentMaterial = await prisma.material.findUnique({
      where: { id },
    });

    if (!currentMaterial) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    const updateData: any = {
      name: body.name,
      description: body.description,
      sku: body.sku,
      barcode: body.barcode,
      categoryRel: body.categoryId ? {
        connect: { id: body.categoryId }
      } : undefined,
      unit: body.unit !== undefined ? (body.unit || undefined) : undefined,
      minStockLevel: body.minStockLevel !== undefined ? parseFloat(body.minStockLevel) : undefined,
      maxStockLevel: body.maxStockLevel !== undefined ? (body.maxStockLevel ? parseFloat(body.maxStockLevel) : null) : undefined,
      reorderPoint: body.reorderPoint !== undefined ? parseFloat(body.reorderPoint) : undefined,
      location: body.location,
      supplier: body.supplier,
      supplierRel: body.supplierId ? {
        connect: { id: body.supplierId }
      } : undefined,
      status: body.status,
      notes: body.notes,
    };

    if (updateData.unit === null) delete updateData.unit; // Ensure unit is never set to null

    if (quantity !== undefined) updateData.quantity = quantity;
    if (unitCost !== undefined) updateData.unitCost = unitCost;
    
    // Recalculate total cost if either quantity or unitCost is provided (even if only one is updated)
    const finalQuantity = quantity !== undefined ? quantity : currentMaterial.quantity;
    const finalUnitCost = unitCost !== undefined ? unitCost : currentMaterial.unitCost;
    updateData.totalCost = finalQuantity * finalUnitCost;

    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const result = await prisma.$transaction(async (tx) => {
      const updatedMaterial = await tx.material.update({
        where: { id },
        data: updateData,
        include: {
          categoryRel: true,
          supplierRel: true,
          site: {
            include: {
              contractor: true
            }
          },
        },
      });

      if (quantity !== undefined && quantity !== currentMaterial.quantity) {
        const change = quantity - currentMaterial.quantity;
        await tx.stockMovement.create({
          data: {
            materialId: id,
            quantity: quantity,
            change: change,
            type: change > 0 ? 'in' : 'out',
            notes: body.notes || 'Quantity updated via edit',
          },
        });
      }

      return updatedMaterial;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to update material:', error);
    return NextResponse.json({ error: 'Failed to update material' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.material.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Material deleted' });
  } catch (error) {
    console.error('Failed to delete material:', error);
    return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 });
  }
}