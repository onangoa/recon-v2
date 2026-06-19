import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id } = await params;

  const visitor = await prisma.visitor.findUnique({ where: { id } });
  if (!visitor) return mobileError('Visitor not found', 404);

  if (visitor.checkOutTime) return mobileError('Visitor already checked out', 400);

  const updated = await prisma.visitor.update({
    where: { id },
    data: { checkOutTime: new Date() },
  });

  return mobileSuccess({
    id: updated.id,
    name: updated.name,
    check_in_time: updated.checkInTime,
    check_out_time: updated.checkOutTime,
  }, 'Visitor checked out successfully');
}