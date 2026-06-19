import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id } = await params;

  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { supplier: true, items: true },
  });
  if (!order) return mobileError('Purchase order not found', 404);

  return mobileSuccess({
    id: order.id,
    order_number: order.orderNumber,
    site_id: order.siteId,
    supplier_id: order.supplierId,
    supplier: { id: order.supplier.id, name: order.supplier.name },
    status: order.status,
    subtotal: order.subtotal,
    tax: order.tax,
    total: order.total,
    order_date: order.orderDate,
    expected_delivery_date: order.expectedDeliveryDate,
    notes: order.notes,
    items: order.items.map(i => ({
      id: i.id,
      description: i.description,
      quantity: i.quantity,
      unit_price: i.unitPrice,
      total_price: i.totalPrice,
    })),
    created_at: order.createdAt,
    updated_at: order.updatedAt,
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id } = await params;

  const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!existing) return mobileError('Purchase order not found', 404);

  const body = await request.json();
  const data: any = {};
  if (body.status !== undefined) data.status = body.status;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.tax !== undefined) data.tax = body.tax;
  if (body.subtotal !== undefined) data.subtotal = body.subtotal;
  if (body.total !== undefined) data.total = body.total;
  if (body.expected_delivery_date !== undefined) data.expectedDeliveryDate = new Date(body.expected_delivery_date);

  if (body.items && Array.isArray(body.items)) {
    await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
    data.items = {
      create: body.items.map((i: any) => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        totalPrice: i.total_price || i.quantity * i.unit_price,
        materialId: i.material_id || null,
      })),
    };
  }

  const order = await prisma.purchaseOrder.update({
    where: { id },
    data,
    include: { items: true },
  });

  return mobileSuccess({
    id: order.id,
    order_number: order.orderNumber,
    status: order.status,
    items: order.items.map(i => ({ id: i.id, description: i.description })),
  }, 'Purchase order updated successfully');
}