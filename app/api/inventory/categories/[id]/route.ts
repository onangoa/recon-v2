import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const category = await prisma.inventoryCategory.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        parentId: body.parentId,
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { materials: true }
        }
      }
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Failed to update category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if category has materials
    const categoryWithMaterials = await prisma.inventoryCategory.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { materials: true }
        }
      }
    });

    if (!categoryWithMaterials) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (categoryWithMaterials._count.materials > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete category with associated materials' 
      }, { status: 400 });
    }

    await prisma.inventoryCategory.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}