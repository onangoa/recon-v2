import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requirePermission(request, 'inventory:read');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const { id } = await params;
    // Restrict to categories owned by this contractor (or shared globals).
    const where: any = { id };
    if (permCheck.contractorId) {
      where.OR = [{ contractorId: permCheck.contractorId }, { contractorId: null }];
    }
    const category = await prisma.inventoryCategory.findFirst({
      where,
      include: {
        parent: true,
        subCategories: true,
        _count: {
          select: { inventory: true }
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
  const permCheck = await requirePermission(request, 'inventory:update');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Restrict updates to categories owned by this contractor. Shared global
    // categories (contractorId = null) are read-only for individual contractors.
    const existing = permCheck.contractorId
      ? await prisma.inventoryCategory.findFirst({ where: { id, contractorId: permCheck.contractorId } })
      : await prisma.inventoryCategory.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
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
        subCategories: true,
        _count: {
          select: { inventory: true }
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
  const permCheck = await requirePermission(request, 'inventory:delete');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const { id } = await params;

    // Restrict deletes to categories owned by this contractor.
    const owningWhere: any = { id };
    if (permCheck.contractorId) {
      owningWhere.contractorId = permCheck.contractorId;
    }

    const categoryWithMaterials = await prisma.inventoryCategory.findFirst({
      where: owningWhere,
      include: {
        _count: {
          select: { inventory: true }
        }
      }
    });

    if (!categoryWithMaterials) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (categoryWithMaterials._count.inventory > 0) {
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