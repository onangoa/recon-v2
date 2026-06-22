import { NextRequest } from 'next/server';
import { mobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }

  const contractorId = auth.contractorId || auth.companyId;
  if (!contractorId) return Response.json({ error: true, message: 'No company associated' }, { status: 403 });

  const siteId = request.nextUrl.searchParams.get('site_id') || auth.siteId;
  const siteIds = siteId
    ? [siteId]
    : await prisma.site.findMany({ where: { contractorId }, select: { id: true } }).then(s => s.map(x => x.id));

  const visitors = await prisma.visitor.findMany({
    where: { siteId: { in: siteIds } },
    orderBy: { createdAt: 'desc' },
  });

  return Response.json({
    total: visitors.length,
    rows: visitors.map(v => ({
      id: v.id,
      name: v.name,
      company: v.company || '-',
      category: '-',
      purpose: v.purpose,
      time_in: v.checkInTime,
      time_out: v.checkOutTime || '-',
      status: v.checkOutTime ? 'checked_out' : 'checked_in',
      obj_status: v.checkOutTime ? 'checked_out' : 'checked_in',
      created_at: v.createdAt,
      updated_at: v.updatedAt,
      actions: '',
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }

  const contractorId = auth.contractorId;
  if (!contractorId) return Response.json({ error: true, message: 'No company associated' }, { status: 403 });

  const body = await request.json();
  const siteId = body.site_id || auth.siteId;
  if (!siteId) return Response.json({ error: true, message: 'site_id is required' }, { status: 400 });

  const site = await prisma.site.findFirst({ where: { id: siteId, contractorId } });
  if (!site) return Response.json({ error: true, message: 'Site not found' }, { status: 404 });

  const visitor = await prisma.visitor.create({
    data: {
      name: body.name,
      company: body.company || null,
      purpose: body.purpose || 'Visit',
      siteId,
      checkInTime: new Date(),
    },
  });

  return Response.json({
    error: false,
    message: 'Visitor checked in successfully.',
    visitor: {
      id: visitor.id,
      name: visitor.name,
      company: visitor.company,
      purpose: visitor.purpose,
      check_in_time: visitor.checkInTime,
      check_out_time: visitor.checkOutTime,
      site_id: visitor.siteId,
      created_at: visitor.createdAt,
      updated_at: visitor.updatedAt,
    },
  });
}