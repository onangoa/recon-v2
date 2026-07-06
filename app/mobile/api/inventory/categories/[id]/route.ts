import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequirePermission(request, 'inventory:read');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const { id } = await params;
    const category = await prisma.inventoryCategory.findUnique({
      where: { id },
      include: {
        parent: true,
        subCategories: true,
        _count: {
          select: { inventory: true }
        }
      }
    });

    if (!category) {
      return mobileError('Category not found', 404);
    }

    return mobileSuccess(category);
  } catch (error) {
    console.error('Mobile fetch category error:', error);
    return mobileError('Failed to fetch category', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequirePermission(request, 'inventory:update');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.name) {
      return mobileError('Name is required', 400);
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

    return mobileSuccess(category, 'Category updated');
  } catch (error) {
    console.error('Mobile update category error:', error);
    return mobileError('Failed to update category', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequirePermission(request, 'inventory:delete');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const { id } = await params;
    const categoryWithMaterials = await prisma.inventoryCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { inventory: true }
        }
      }
    });

    if (!categoryWithMaterials) {
      return mobileError('Category not found', 404);
    }

    if (categoryWithMaterials._count.inventory > 0) {
      return mobileError('Cannot delete category with associated materials', 400);
    }

    await prisma.inventoryCategory.delete({
      where: { id }
    });

    return mobileSuccess(null, 'Category deleted');
  } catch (error) {
    console.error('Mobile delete category error:', error);
    return mobileError('Failed to delete category', 500);
  }
}
