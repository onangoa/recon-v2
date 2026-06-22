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

  const qrData = JSON.stringify({
    visitor_id: visitor.id,
    name: visitor.name,
    company: visitor.company,
    purpose: visitor.purpose,
    site_id: visitor.siteId,
    check_in_time: visitor.checkInTime,
  });

  return Response.json({
    success: true,
    message: 'QR code generated successfully.',
    qr_code: qrData,
  });
}