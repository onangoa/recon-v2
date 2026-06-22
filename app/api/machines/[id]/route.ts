import { NextRequest } from 'next/server';
import { mobileAuth, mobileSuccessOk } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const { id } = await params;

  const machine = await prisma.equipment.findUnique({
    where: { id },
    include: { site: true },
  });
  if (!machine) return Response.json({ success: false, message: 'Machine not found' }, { status: 404 });

  return mobileSuccessOk({
    id: machine.id,
    name: machine.name,
    model: machine.serialNo,
    registration_number: machine.serialNumber,
    type: machine.type,
    condition: machine.status,
    site: machine.site ? { id: machine.site.id, title: machine.site.name } : null,
    site_id: machine.siteId,
    daily_rate: machine.dailyRate,
    rental_cost: machine.rentalCost,
    last_service: machine.lastService,
    next_service: machine.nextService,
    created_at: machine.createdAt,
    updated_at: machine.updatedAt,
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const { id } = await params;

  const body = await request.json();
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.model !== undefined) data.serialNo = body.model;
  if (body.registration_number !== undefined) data.serialNumber = body.registration_number;
  if (body.condition_key !== undefined) data.status = body.condition_key;
  if (body.type_key !== undefined) data.type = body.type_key;
  if (body.daily_rate !== undefined) data.dailyRate = body.daily_rate;
  if (body.rental_cost !== undefined) data.rentalCost = body.rental_cost;

  const machine = await prisma.equipment.update({ where: { id }, data });
  return Response.json({
    success: true,
    message: 'Machine updated successfully.',
    machine: { id: machine.id, name: machine.name, type: machine.type, condition: machine.status },
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const { id } = await params;

  await prisma.equipment.delete({ where: { id } });
  return Response.json({ success: true, message: 'Machine deleted successfully.' });
}