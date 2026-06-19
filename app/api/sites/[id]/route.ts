import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id } = await params;

  const site = await prisma.site.findUnique({ where: { id } });
  if (!site) return mobileError('Site not found', 404);

  return mobileSuccess({
    id: site.id,
    title: site.name,
    description: site.description,
    status: site.status,
    priority: 'medium',
    start_date: site.createdAt,
    is_primary: site.isPrimary,
    company_id: site.contractorId,
    location: site.location,
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id } = await params;

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

  return mobileSuccess({
    id: site.id,
    title: site.name,
    description: site.description,
    location: site.location,
  }, 'Site updated successfully');
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id } = await params;

  await prisma.site.delete({ where: { id } });
  return mobileSuccess(null, 'Site deleted successfully');
}