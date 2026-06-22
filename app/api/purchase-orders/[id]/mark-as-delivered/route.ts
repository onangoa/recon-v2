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

  if (!['approved', 'processing'].includes(order.status)) {
    return Response.json({ error: true, message: 'Only approved purchase orders can be marked as delivered.' }, { status: 400 });
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: { status: 'delivered' },
  });

  return Response.json({
    error: false,
    message: 'Purchase order marked as delivered successfully. Material delivery entry created.',
    purchase_order: { id: updated.id, order_number: updated.orderNumber, status: updated.status },
  });
}