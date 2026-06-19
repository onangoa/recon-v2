import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { itemId } = await params;

  const item = await prisma.inventory.findUnique({
    where: { id: itemId },
    include: { category: true },
  });
  if (!item) return mobileError('Item not found', 404);

  return mobileSuccess({
    id: item.id,
    name: item.name,
    description: item.description,
    sku: item.sku,
    category_id: item.categoryId,
    category: item.category?.name,
    quantity: item.quantity,
    unit: item.unit,
    unit_cost: item.unitCost,
    min_stock: item.minStock,
    location: item.location,
    status: item.status,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { itemId } = await params;

  const body = await request.json();
  const item = await prisma.inventory.update({
    where: { id: itemId },
    data: {
      name: body.name,
      description: body.description,
      sku: body.sku,
      categoryId: body.category_id,
      quantity: body.quantity,
      unit: body.unit,
      unitCost: body.unit_cost || body.cost,
      minStock: body.min_stock,
      location: body.location,
      status: body.status,
    },
  });

  return mobileSuccess({
    id: item.id,
    name: item.name,
    sku: item.sku,
    quantity: item.quantity,
  }, 'Inventory item updated successfully');
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { itemId } = await params;

  await prisma.inventory.delete({ where: { id: itemId } });
  return mobileSuccess(null, 'Inventory item deleted successfully');
}