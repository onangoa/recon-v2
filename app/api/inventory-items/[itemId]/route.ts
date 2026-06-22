import { NextRequest } from 'next/server';
import { mobileAuth, mobileSuccessOk } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const { itemId } = await params;

  const item = await prisma.inventory.findUnique({
    where: { id: itemId },
    include: { category: true, site: true, supplier: true },
  });
  if (!item) return Response.json({ success: false, message: 'Item not found' }, { status: 404 });

  return mobileSuccessOk({
    inventoryItem: {
      id: item.id,
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      unit: item.unit,
      unit_cost: item.unitCost,
      min_stock: item.minStock,
      location: item.location,
      status: item.status,
      category_id: item.categoryId,
      site_id: item.siteId,
      supplier_id: item.supplierId,
      description: item.description,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
      inventoryCategory: item.category,
      site: item.site,
      supplier: item.supplier,
    },
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const { itemId } = await params;

  const body = await request.json();
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (body.sku !== undefined) data.sku = body.sku;
  if (body.category_id !== undefined) data.categoryId = body.category_id;
  if (body.quantity !== undefined) data.quantity = body.quantity;
  if (body.unit !== undefined) data.unit = body.unit;
  if (body.unit_cost !== undefined || body.cost !== undefined) data.unitCost = body.unit_cost || body.cost;
  if (body.min_stock !== undefined) data.minStock = body.min_stock;
  if (body.location !== undefined) data.location = body.location;
  if (body.status !== undefined) data.status = body.status;

  const item = await prisma.inventory.update({
    where: { id: itemId },
    data,
  });

  return Response.json({
    success: true,
    message: 'Inventory item updated successfully.',
    data: {
      inventory_item: {
        id: item.id,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unit: item.unit,
        unit_cost: item.unitCost,
        min_stock: item.minStock,
        location: item.location,
        status: item.status,
      },
      request_type: 'mobile_api',
    },
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const { itemId } = await params;

  await prisma.inventory.delete({ where: { id: itemId } });
  return Response.json({ success: true, message: 'Inventory item deleted successfully.', data: { request_type: 'mobile_api' } });
}