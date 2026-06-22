import { NextRequest } from 'next/server';
import { mobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }

  const contractorId = auth.contractorId || auth.companyId;
  if (!contractorId) return Response.json({ error: true, message: 'Company ID is required.' }, { status: 400 });

  const siteId = request.nextUrl.searchParams.get('site_id') || auth.siteId;
  const siteIds = siteId
    ? [siteId]
    : await prisma.site.findMany({ where: { contractorId }, select: { id: true } }).then(s => s.map(x => x.id));

  const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
  const perPage = parseInt(request.nextUrl.searchParams.get('per_page') || '15');

  const deliveries = await prisma.purchaseOrder.findMany({
    where: { siteId: { in: siteIds }, status: 'delivered' },
    include: { supplier: true, items: true },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * perPage,
    take: perPage,
  });

  const total = await prisma.purchaseOrder.count({ where: { siteId: { in: siteIds }, status: 'delivered' } });

  return Response.json({
    error: false,
    material_deliveries: {
      data: deliveries.map(d => ({
        id: d.id,
        order_number: d.orderNumber,
        supplier: d.supplier ? { id: d.supplier.id, name: d.supplier.name } : null,
        site: { id: d.siteId },
        status: d.status,
        total: d.total,
        delivery_date: d.expectedDeliveryDate,
        items: d.items.map(i => ({ id: i.id, description: i.description, quantity: i.quantity, unit_price: i.unitPrice })),
        created_at: d.createdAt,
        updated_at: d.updatedAt,
      })),
      current_page: page,
      per_page: perPage,
      total,
    },
  });
}