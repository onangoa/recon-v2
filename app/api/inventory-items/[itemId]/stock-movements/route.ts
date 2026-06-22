import { NextRequest } from 'next/server';
import { mobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const { itemId } = await params;

  const movements = await prisma.stockMovement.findMany({
    where: { inventoryId: itemId },
    orderBy: { createdAt: 'desc' },
  });

  return Response.json({
    total: movements.length,
    rows: movements.map(m => ({
      id: m.id,
      created_at: m.createdAt,
      movement_type: m.type,
      quantity: String(m.change),
      unit_price: String(0),
      total_amount: String(0),
      notes: m.notes,
      created_by: '',
    })),
  });
}