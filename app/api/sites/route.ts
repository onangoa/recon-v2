import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const contractorId = auth.contractorId;
  if (!contractorId) return mobileError('No company associated', 403);

  const companyId = request.nextUrl.searchParams.get('company_id');
  const where: any = { contractorId };
  if (companyId) where.contractorId = companyId;

  const sites = await prisma.site.findMany({ where, orderBy: { isPrimary: 'desc' } });

  return mobileSuccess(sites.map(s => ({
    id: s.id,
    title: s.name,
    description: s.description,
    status: s.status,
    priority: 'medium',
    start_date: s.createdAt,
    is_primary: s.isPrimary,
    company_id: s.contractorId,
    location: s.location,
  })));
}

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const contractorId = auth.contractorId;
  if (!contractorId) return mobileError('No company associated', 403);

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

  return mobileSuccess({
    id: site.id,
    title: site.name,
    location: site.location,
    is_primary: site.isPrimary,
  }, 'Site created successfully');
}