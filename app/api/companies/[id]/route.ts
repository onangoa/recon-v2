import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id } = await params;

  const company = await prisma.contractor.findUnique({ where: { id } });
  if (!company) return mobileError('Company not found', 404);

  return mobileSuccess({
    id: company.id,
    title: company.companyName,
    description: company.location,
    address: company.location,
    phone: company.phoneNumber,
    logo: company.logo,
    is_primary: true,
    created_at: company.createdAt,
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id } = await params;

  const body = await request.json();
  const company = await prisma.contractor.update({
    where: { id },
    data: {
      companyName: body.title || body.companyName,
      location: body.address || body.location,
      phoneNumber: body.phone || body.phoneNumber,
    },
  });

  return mobileSuccess({
    id: company.id,
    title: company.companyName,
    description: company.location,
    address: company.location,
    phone: company.phoneNumber,
    logo: company.logo,
  }, 'Company updated successfully');
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id } = await params;

  await prisma.contractor.delete({ where: { id } });
  return mobileSuccess(null, 'Company deleted successfully');
}