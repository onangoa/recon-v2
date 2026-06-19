import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const contractorId = auth.contractorId || auth.companyId;
  if (!contractorId) return mobileError('No company associated', 403);

  const siteId = request.nextUrl.searchParams.get('site_id') || auth.siteId;
  const siteIds = siteId
    ? [siteId]
    : await prisma.site.findMany({ where: { contractorId }, select: { id: true } }).then(s => s.map(x => x.id));

  const deliveries = await prisma.purchaseOrder.findMany({
    where: { siteId: { in: siteIds }, status: 'delivered' },
    include: { supplier: true, items: true },
    orderBy: { createdAt: 'desc' },
  });

  return mobileSuccess(deliveries.map(d => ({
    id: d.id,
    order_number: d.orderNumber,
    site_id: d.siteId,
    supplier: { id: d.supplier.id, name: d.supplier.name },
    status: d.status,
    subtotal: d.subtotal,
    tax: d.tax,
    total: d.total,
    order_date: d.orderDate,
    expected_delivery_date: d.expectedDeliveryDate,
    notes: d.notes,
    items: d.items.map(i => ({
      id: i.id,
      description: i.description,
      quantity: i.quantity,
      unit_price: i.unitPrice,
      total_price: i.totalPrice,
    })),
    created_at: d.createdAt,
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

  const site = await prisma.site.findFirst({ where: { id: siteId, contractorId } });
  if (!site) return mobileError('Site not found', 404);

  const items = body.items || [];
  const subtotal = items.reduce((sum: number, i: any) => sum + (i.total_price || i.quantity * i.unit_price), 0);
  const tax = body.tax || 0;

  const order = await prisma.purchaseOrder.create({
    data: {
      siteId,
      supplierId: body.supplier_id,
      orderNumber: body.order_number || `DEL-${Date.now()}`,
      status: 'delivered',
      subtotal,
      tax,
      total: subtotal + tax,
      notes: body.notes || null,
      items: {
        create: items.map((i: any) => ({
          description: i.description || i.material_name,
          quantity: i.quantity,
          unitPrice: i.unit_price,
          totalPrice: i.total_price || i.quantity * i.unit_price,
          materialId: i.material_id || null,
        })),
      },
    },
    include: { items: true },
  });

  return mobileSuccess({
    id: order.id,
    order_number: order.orderNumber,
    status: order.status,
    total: order.total,
  }, 'Material delivery logged successfully');
}