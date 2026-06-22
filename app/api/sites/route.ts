import { NextRequest } from 'next/server';
import { mobileAuth, cuidToInt } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }

  const contractorId = auth.contractorId;
  if (!contractorId) return Response.json({ error: true, message: 'No company associated' }, { status: 403 });

  const companyId = request.nextUrl.searchParams.get('company_id');
  const where: any = { contractorId };
  if (companyId) where.contractorId = companyId;

  const sites = await prisma.site.findMany({ where, orderBy: { isPrimary: 'desc' } });

  return Response.json({
    error: false,
    message: 'Sites retrieved successfully.',
    total: sites.length,
    data: sites.map(s => ({
      id: cuidToInt(s.id),
      title: s.name,
      description: s.description,
      status_id: 1,
      status: s.status,
      priority_id: 3,
      priority: 'medium',
      start_date: s.createdAt,
      end_date: null,
      budget: 0,
      task_accessibility: 'all',
      is_favorite: 0,
      is_primary: s.isPrimary ? 1 : 0,
      company_id: cuidToInt(s.contractorId),
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }

  const contractorId = auth.contractorId;
  if (!contractorId) return Response.json({ error: true, message: 'Missing or invalid company.' }, { status: 400 });

  try {
    const body = await request.json();

    const site = await prisma.site.create({
      data: {
        name: body.title || body.name,
        location: body.location || '',
        description: body.description,
        status: body.status || 'Active',
        contractorId,
        isPrimary: body.is_primary || false,
      },
    });

    return Response.json({
      error: false,
      message: 'Site created successfully.',
      id: cuidToInt(site.id),
      data: {
        id: cuidToInt(site.id),
        title: site.name,
        description: site.description,
        status: site.status,
        is_primary: site.isPrimary ? 1 : 0,
        company_id: cuidToInt(site.contractorId),
      },
    });
  } catch (error: any) {
    return Response.json({
      error: true,
      message: 'Site could not be created.',
      data: { error: error.message, line: 0, file: '' },
    }, { status: 500 });
  }
}