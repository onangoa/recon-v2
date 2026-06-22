import { NextRequest } from 'next/server';
import { mobileAuth, mobileErrorOk, cuidToInt } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }

  const contractorId = auth.contractorId || auth.companyId;
  if (!contractorId) return mobileErrorOk('Company ID is required.', 422);

  const siteId = request.nextUrl.searchParams.get('site_id') || auth.siteId;

  const siteIds = siteId ? [siteId] : await prisma.site.findMany({ where: { contractorId }, select: { id: true } }).then(s => s.map(x => x.id));

  const search = request.nextUrl.searchParams.get('search') || '';
  const where: any = { siteId: { in: siteIds } };
  if (search) where.name = { contains: search };

  const [items, total] = await Promise.all([
    prisma.inventory.findMany({
      where,
      include: { category: true, site: true, supplier: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.inventory.count({ where }),
  ]);

  return Response.json({
    total,
    rows: items.map(item => ({
      id: cuidToInt(item.id),
      name: item.name,
      sku: item.sku,
      category: item.category?.name || '',
      current_stock: String(item.quantity || 0),
      unit_price: String(item.unitCost || 0),
      status: item.status,
      obj_status: item.status,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
      actions: '',
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }

  const contractorId = auth.contractorId;
  if (!contractorId) return mobileErrorOk('Company ID is required.', 422);

  const body = await request.json();
  const siteId = body.site_id || auth.siteId;
  if (!siteId) return mobileErrorOk('Site ID is required.', 422);

  const site = await prisma.site.findFirst({ where: { id: siteId, contractorId } });
  if (!site) return mobileErrorOk('Site not found', 404);

  const item = await prisma.inventory.create({
    data: {
      name: body.name,
      description: body.description,
      sku: body.sku,
      categoryId: body.category_id || null,
      quantity: body.quantity || 0,
      unit: body.unit || 'pcs',
      unitCost: body.unit_price || body.cost || 0,
      minStock: body.min_stock || 0,
      location: body.location,
      siteId,
      status: 'in-stock',
    },
    include: { category: true, site: true, supplier: true },
  });

  return Response.json({
    success: true,
    message: 'Inventory item created successfully.',
    data: {
      inventory_item: {
        id: cuidToInt(item.id),
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unit: item.unit,
        unit_cost: item.unitCost,
        min_stock: item.minStock,
        location: item.location,
        status: item.status,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      },
      request_type: 'mobile_api',
    },
  }, { status: 201 });
}