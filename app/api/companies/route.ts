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

  const companies = await prisma.contractor.findMany({
    where: { id: contractorId },
    include: { sites: true },
  });

  return Response.json({
    error: false,
    message: 'Companies retrieved successfully.',
    data: {
      total: companies.length,
      data: companies.map(c => ({
        id: cuidToInt(c.id),
        title: c.companyName,
        description: c.location,
        address: c.location,
        phone: c.phoneNumber,
        email: c.email || null,
        website: null,
        is_primary: true,
        created_at: c.createdAt,
      })),
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }

  try {
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

    return Response.json({
      error: false,
      message: 'Company created successfully.',
      id: cuidToInt(company.id),
      data: {
        id: cuidToInt(company.id),
        title: company.companyName,
        description: company.location,
        address: company.location,
        phone: company.phoneNumber,
        is_primary: true,
      },
    });
  } catch (error: any) {
    return Response.json({ error: true, message: 'An error occurred while creating the company.' }, { status: 500 });
  }
}