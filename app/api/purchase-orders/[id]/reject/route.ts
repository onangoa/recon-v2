import { NextRequest } from 'next/server';
import { mobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }
  const { id } = await params;

  const order = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!order) return Response.json({ error: true, message: 'Purchase order not found.' }, { status: 404 });

  if (order.status !== 'pending') {
    return Response.json({ error: true, message: 'Only pending purchase orders can be rejected.' }, { status: 400 });
  }

  const body = await request.json();
  if (!body.rejection_reason) {
    return Response.json({
      error: true,
      message: 'Rejection reason is required.',
      errors: { rejection_reason: ['The rejection reason field is required.'] },
    }, { status: 422 });
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: { status: 'rejected', notes: body.rejection_reason || body.reason || order.notes },
  });

  return Response.json({
    error: false,
    message: 'Purchase order rejected successfully.',
    purchase_order: { id: updated.id, order_number: updated.orderNumber, status: updated.status },
  });
}