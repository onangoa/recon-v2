import { NextRequest } from 'next/server';
import { mobileAuth, mobileSuccessOk } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }

  const contractorId = auth.contractorId || auth.companyId;
  if (!contractorId) return Response.json({ error: 'No company selected.' }, { status: 400 });

  const siteId = request.nextUrl.searchParams.get('site_id') || auth.siteId;
  const siteIds = siteId
    ? [siteId]
    : await prisma.site.findMany({ where: { contractorId }, select: { id: true } }).then(s => s.map(x => x.id));

  const machines = await prisma.equipment.findMany({
    where: { siteId: { in: siteIds } },
    include: { site: true },
    orderBy: { createdAt: 'desc' },
  });

  return Response.json({
    total: machines.length,
    data: machines.map(m => ({
      id: m.id,
      name: m.name,
      model: m.serialNo,
      registration_number: m.serialNumber,
      type: m.type,
      condition: m.status,
      site: m.site ? { id: m.site.id, title: m.site.name } : null,
      site_id: m.siteId,
      daily_rate: m.dailyRate,
      rental_cost: m.rentalCost,
      last_service: m.lastService,
      next_service: m.nextService,
      created_at: m.createdAt,
      updated_at: m.updatedAt,
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }

  const contractorId = auth.contractorId;
  if (!contractorId) return Response.json({ success: false, message: 'No company selected.' }, { status: 400 });

  const body = await request.json();
  const siteId = body.site_id || auth.siteId;
  if (!siteId) return Response.json({ success: false, message: 'No company selected.' }, { status: 400 });

  const site = await prisma.site.findFirst({ where: { id: siteId, contractorId } });
  if (!site) return Response.json({ success: false, message: 'You do not have permission to create machines.' }, { status: 400 });

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

  return Response.json({
    success: true,
    message: 'Machine created successfully.',
    machine: { id: machine.id, name: machine.name, type: machine.type, condition: machine.status, site_id: machine.siteId },
  });
}