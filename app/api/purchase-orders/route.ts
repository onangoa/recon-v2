import { NextRequest } from 'next/server';
import { mobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }

  const contractorId = auth.contractorId || auth.companyId;
  if (!contractorId) return Response.json({ error: 'No company selected.' }, { status: 400 });

  const siteId = request.nextUrl.searchParams.get('site_id') || auth.siteId;
  const siteIds = siteId
    ? [siteId]
    : await prisma.site.findMany({ where: { contractorId }, select: { id: true } }).then(s => s.map(x => x.id));

  const orders = await prisma.purchaseOrder.findMany({
    where: { siteId: { in: siteIds } },
    include: { supplier: true, items: true },
    orderBy: { createdAt: 'desc' },
  });

  return Response.json({
    rows: orders.map(o => ({
      id: o.id,
      order_number: o.orderNumber,
      supplier: o.supplier?.name || null,
      site: null,
      total_amount: String(o.total),
      status: o.status,
      priority: 'medium',
      obj_status: o.status,
      obj_priority: 'medium',
      delivery_date: o.expectedDeliveryDate,
      created_at: o.createdAt,
      updated_at: o.updatedAt,
      actions: '',
    })),
    total: orders.length,
  });
}

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }

  const contractorId = auth.contractorId;
  if (!contractorId) return Response.json({ error: 'No company selected.' }, { status: 400 });

  const body = await request.json();
  const siteId = body.site_id || auth.siteId;
  if (!siteId) return Response.json({ error: true, message: 'site_id is required' }, { status: 400 });

  const site = await prisma.site.findFirst({ where: { id: siteId, contractorId } });
  if (!site) return Response.json({ error: true, message: 'Site not found' }, { status: 404 });

  if (!body.supplier_id) return Response.json({ error: true, message: 'supplier_id is required' }, { status: 400 });

  const items = body.items || [];
  const subtotal = items.reduce((sum: number, i: any) => sum + (i.total_price || i.quantity * i.unit_price), 0);
  const tax = body.tax || 0;
  const total = subtotal + tax;

  const order = await prisma.purchaseOrder.create({
    data: {
      siteId,
      supplierId: body.supplier_id,
      orderNumber: body.order_number || `PO-${Date.now()}`,
      status: body.status || 'pending',
      subtotal,
      tax,
      total,
      orderDate: body.order_date ? new Date(body.order_date) : new Date(),
      expectedDeliveryDate: body.expected_delivery_date ? new Date(body.expected_delivery_date) : null,
      notes: body.notes || null,
      items: {
        create: items.map((i: any) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unit_price,
          totalPrice: i.total_price || i.quantity * i.unit_price,
          materialId: i.material_id || null,
        })),
      },
    },
    include: { supplier: true, items: true },
  });

  return Response.json({
    error: false,
    message: 'Purchase order created successfully.',
    purchase_order: {
      id: order.id,
      order_number: order.orderNumber,
      status: order.status,
      total: order.total,
      supplier: { id: order.supplier?.id, name: order.supplier?.name },
      site: { id: order.siteId },
      items: order.items.map(i => ({ id: i.id, description: i.description, quantity: i.quantity, unit_price: i.unitPrice, total_price: i.totalPrice })),
    },
  });
}