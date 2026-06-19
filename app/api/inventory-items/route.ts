import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const contractorId = auth.contractorId || auth.companyId;
  if (!contractorId) return mobileError('No company associated', 403);

  const search = request.nextUrl.searchParams.get('search') || '';
  const siteId = request.nextUrl.searchParams.get('site_id') || auth.siteId;

  const siteIds = siteId ? [siteId] : await prisma.site.findMany({ where: { contractorId }, select: { id: true } }).then(s => s.map(x => x.id));

  const where: any = { siteId: { in: siteIds } };
  if (search) where.name = { contains: search };

  const items = await prisma.inventory.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  return mobileSuccess(items.map(item => ({
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
  })));
}

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const contractorId = auth.contractorId;
  if (!contractorId) return mobileError('No company associated', 403);

  const body = await request.json();
  const siteId = body.site_id || auth.siteId;
  if (!siteId) return mobileError('site_id is required', 400);

  const item = await prisma.inventory.create({
    data: {
      name: body.name,
      description: body.description,
      sku: body.sku,
      categoryId: body.category_id || null,
      quantity: body.quantity || 0,
      unit: body.unit || 'pcs',
      unitCost: body.unit_cost || body.cost || 0,
      minStock: body.min_stock || 0,
      location: body.location,
      siteId,
      status: 'in-stock',
    },
  });

  return mobileSuccess({
    id: item.id,
    name: item.name,
    sku: item.sku,
    quantity: item.quantity,
    unit: item.unit,
  }, 'Inventory item created successfully');
}