import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const contractorId = auth.contractorId || auth.companyId;
  if (!contractorId) return mobileError('No company associated', 403);

  const siteId = request.nextUrl.searchParams.get('site_id') || auth.siteId;
  const siteIds = siteId
    ? [siteId]
    : await prisma.site.findMany({ where: { contractorId }, select: { id: true } }).then(s => s.map(x => x.id));

  const visitors = await prisma.visitor.findMany({
    where: { siteId: { in: siteIds } },
    orderBy: { createdAt: 'desc' },
  });

  return mobileSuccess(visitors.map(v => ({
    id: v.id,
    name: v.name,
    company: v.company,
    purpose: v.purpose,
    site_id: v.siteId,
    check_in_time: v.checkInTime,
    check_out_time: v.checkOutTime,
    created_at: v.createdAt,
    updated_at: v.updatedAt,
  })));
}

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const contractorId = auth.contractorId;
  if (!contractorId) return mobileError('No company associated', 403);

  const body = await request.json();
  const siteId = body.site_id || auth.siteId;
  if (!siteId) return mobileError('site_id is required', 400);

  const site = await prisma.site.findFirst({ where: { id: siteId, contractorId } });
  if (!site) return mobileError('Site not found', 404);

  const visitor = await prisma.visitor.create({
    data: {
      name: body.name,
      company: body.company || null,
      purpose: body.purpose || 'Visit',
      siteId,
      checkInTime: new Date(),
    },
  });

  return mobileSuccess({
    id: visitor.id,
    name: visitor.name,
    company: visitor.company,
    purpose: visitor.purpose,
    check_in_time: visitor.checkInTime,
  }, 'Visitor checked in successfully');
}