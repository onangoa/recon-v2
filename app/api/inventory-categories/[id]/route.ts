import { NextRequest } from 'next/server';
import { mobileAuth, mobileSuccessOk } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const { id } = await params;

  const category = await prisma.inventoryCategory.findUnique({
    where: { id },
    include: { parent: true, subCategories: true, inventoryItems: true },
  });
  if (!category) return Response.json({ success: false, message: 'Category not found' }, { status: 404 });

  return mobileSuccessOk({
    id: category.id,
    name: category.name,
    description: category.description,
    parent_id: category.parentId,
    company_id: category.contractorId,
    is_parent: category.parentId ? 'No' : 'Yes',
    items_count: category.inventoryItems?.length || 0,
    parentCategory: category.parent,
    subCategories: category.subCategories,
    inventoryItems: category.inventoryItems,
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const { id } = await params;

  const existing = await prisma.inventoryCategory.findUnique({ where: { id } });
  if (!existing) return Response.json({ success: false, message: 'Category not found' }, { status: 404 });

  const body = await request.json();
  const category = await prisma.inventoryCategory.update({
    where: { id },
    data: { name: body.name, description: body.description },
  });

  return Response.json({
    success: true,
    message: 'Inventory category updated successfully.',
    category: { id: category.id, name: category.name, description: category.description },
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const { id } = await params;

  await prisma.inventoryCategory.delete({ where: { id } });
  return Response.json({ success: true, message: 'Inventory category deleted successfully.' });
}