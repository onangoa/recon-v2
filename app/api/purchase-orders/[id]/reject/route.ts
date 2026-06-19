import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id } = await params;

  const order = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!order) return mobileError('Purchase order not found', 404);

  const body = await request.json();

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: { status: 'rejected', notes: body.reason || body.notes || order.notes },
  });

  return mobileSuccess({
    id: updated.id,
    order_number: updated.orderNumber,
    status: updated.status,
  }, 'Purchase order rejected');
}