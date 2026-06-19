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

  const machines = await prisma.equipment.findMany({
    where: { siteId: { in: siteIds } },
    orderBy: { createdAt: 'desc' },
  });

  return mobileSuccess(machines.map(m => ({
    id: m.id,
    name: m.name,
    model: m.serialNo,
    registration_number: m.serialNumber,
    condition_key: m.status,
    type_key: m.type,
    site_id: m.siteId,
    daily_rate: m.dailyRate,
    rental_cost: m.rentalCost,
    last_service: m.lastService,
    next_service: m.nextService,
    created_at: m.createdAt,
    updated_at: m.updatedAt,
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

  const machine = await prisma.equipment.create({
    data: {
      name: body.name,
      type: body.type_key || body.type || 'General',
      serialNo: body.model || null,
      serialNumber: body.registration_number || null,
      status: body.condition_key || body.status || 'Active',
      siteId,
      dailyRate: body.daily_rate || null,
      rentalCost: body.rental_cost || null,
    },
  });

  return mobileSuccess({
    id: machine.id,
    name: machine.name,
    model: machine.serialNo,
    registration_number: machine.serialNumber,
    condition_key: machine.status,
    type_key: machine.type,
    site_id: machine.siteId,
  }, 'Machine created successfully');
}