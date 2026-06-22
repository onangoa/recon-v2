import { NextRequest } from 'next/server';
import { mobileAuth, cuidToInt } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }
  const { id } = await params;

  const site = await prisma.site.findUnique({ where: { id } });
  if (!site) return Response.json({ error: true, message: 'Site not found', total: 0, data: [] }, { status: 200 });

  return Response.json({
    error: false,
    message: 'Site retrieved successfully',
    total: 1,
    data: [{
      id: cuidToInt(site.id),
      title: site.name,
      description: site.description,
      status_id: 1,
      status: site.status,
      priority_id: 3,
      priority: 'medium',
      start_date: site.createdAt,
      end_date: null,
      budget: 0,
      task_accessibility: 'all',
      is_favorite: 0,
      is_primary: site.isPrimary ? 1 : 0,
      company_id: cuidToInt(site.contractorId),
    }],
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }
  const { id } = await params;

  const contractorId = auth.contractorId;
  if (!contractorId) return Response.json({ error: true, message: 'Missing or invalid company.' }, { status: 400 });

  const existing = await prisma.site.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: true, message: 'Site not found.', data: [] }, { status: 404 });
  if (existing.contractorId !== contractorId) {
    return Response.json({ error: true, message: 'Site does not belong to this company.' }, { status: 403 });
  }

  const body = await request.json();
  const site = await prisma.site.update({
    where: { id },
    data: {
      name: body.title || body.name,
      location: body.location,
      description: body.description,
      status: body.status,
    },
  });

  return Response.json({
    error: false,
    message: 'Site updated successfully.',
    id: cuidToInt(site.id),
    data: {
      id: cuidToInt(site.id),
      title: site.name,
      description: site.description,
    },
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }
  const { id } = await params;

  const site = await prisma.site.findUnique({ where: { id } });
  if (!site) return Response.json({ error: true, message: 'Site not found.', data: [] }, { status: 404 });

  await prisma.site.delete({ where: { id } });
  return Response.json({ error: false, message: 'Site deleted successfully.', id, title: site.name, data: [] });
}