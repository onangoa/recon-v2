import { NextRequest } from 'next/server';
import { mobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  const visitor = await prisma.visitor.findUnique({ where: { id } });
  if (!visitor) return Response.json({ success: false, message: 'Visitor not found' }, { status: 404 });

  if (visitor.checkOutTime) {
    return Response.json({ success: false, message: 'Visitor is not currently on site.' });
  }

  const updated = await prisma.visitor.update({
    where: { id },
    data: { checkOutTime: new Date() },
  });

  return Response.json({
    success: true,
    message: 'Visitor checked out successfully.',
    visitor: {
      id: updated.id,
      name: updated.name,
      company: updated.company,
      purpose: updated.purpose,
      check_in_time: updated.checkInTime,
      check_out_time: updated.checkOutTime,
    },
  });
}