import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id } = await params;

  const order = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!order) return mobileError('Purchase order not found', 404);

  if (order.status !== 'pending') return mobileError('Only pending orders can be approved', 400);

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: { status: 'approved' },
  });

  return mobileSuccess({
    id: updated.id,
    order_number: updated.orderNumber,
    status: updated.status,
  }, 'Purchase order approved successfully');
}