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
    
    const updateData: any = {
      name: body.name,
      categoryId: body.categoryId,
      unit: body.unit,
      supplier: body.supplier,
      status: body.status,
    };

    if (quantity !== undefined) updateData.quantity = quantity;
    if (unitCost !== undefined) updateData.unitCost = unitCost;
    if (quantity !== undefined && unitCost !== undefined) {
      updateData.totalCost = quantity * unitCost;
    }

    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const material = await prisma.material.update({
      where: { id },
      data: updateData,
      include: {
        categoryRel: true,
        site: {
          include: {
            contractor: true
          }
        },
      },
    });

    return NextResponse.json(material);
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