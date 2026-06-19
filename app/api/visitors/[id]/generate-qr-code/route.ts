import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id } = await params;

  const visitor = await prisma.visitor.findUnique({ where: { id } });
  if (!visitor) return mobileError('Visitor not found', 404);

  const qrData = JSON.stringify({
    visitor_id: visitor.id,
    name: visitor.name,
    company: visitor.company,
    purpose: visitor.purpose,
    site_id: visitor.siteId,
    check_in_time: visitor.checkInTime,
  });

  return mobileSuccess({
    id: visitor.id,
    name: visitor.name,
    qr_data: qrData,
  }, 'QR code generated successfully');
}