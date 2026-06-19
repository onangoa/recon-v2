import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const contractorId = auth.contractorId;
  if (!contractorId) return mobileError('No company associated', 403);

  const search = request.nextUrl.searchParams.get('search') || '';
  const where: any = { id: contractorId };
  if (search) where.companyName = { contains: search };

  const companies = await prisma.contractor.findMany({ where, include: { sites: true } });

  return mobileSuccess(companies.map(c => ({
    id: c.id,
    title: c.companyName,
    description: c.location,
    address: c.location,
    phone: c.phoneNumber,
    logo: c.logo,
    is_primary: true,
    created_at: c.createdAt,
  })));
}

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const body = await request.json();
  const company = await prisma.contractor.create({
    data: {
      companyName: body.title || body.companyName,
      location: body.address || body.location || '',
      phoneNumber: body.phone || body.phoneNumber || '',
      licenseNo: body.licenseNo || '',
      userId: auth.userId!,
      subscriptionPlanId: (await prisma.subscriptionPlan.findFirst())?.id || '',
    },
  });

  return mobileSuccess({
    id: company.id,
    title: company.companyName,
    is_primary: true,
  }, 'Company created successfully');
}