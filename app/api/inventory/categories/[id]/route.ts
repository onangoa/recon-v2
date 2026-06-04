import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const category = await prisma.inventoryCategory.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { materials: true }
        }
      }
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Failed to fetch category:', error);
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const category = await prisma.inventoryCategory.update({
      where: { id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if category has materials
    const categoryWithMaterials = await prisma.inventoryCategory.findUnique({
      where: { id },
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
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}