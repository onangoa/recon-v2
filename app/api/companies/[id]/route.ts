import { NextRequest } from 'next/server';
import { mobileAuth, cuidToInt } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }
  const { id } = await params;

  const company = await prisma.contractor.findUnique({ where: { id } });
  if (!company) return Response.json({ message: `No query results for model [App\\Models\\Company] ${id}.` }, { status: 404 });

  return Response.json({
    error: false,
    message: 'Company retrieved successfully.',
    data: {
      id: cuidToInt(company.id),
      title: company.companyName,
      description: company.location,
      address: company.location,
      phone: company.phoneNumber,
      email: company.email || null,
      website: null,
      is_primary: true,
      created_at: company.createdAt,
    },
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }
  const { id } = await params;

  try {
    const body = await request.json();
    const company = await prisma.contractor.update({
      where: { id },
      data: {
        companyName: body.title || body.companyName,
        location: body.address || body.location,
        phoneNumber: body.phone || body.phoneNumber,
      },
    });

    return Response.json({
      error: false,
      message: 'Company updated successfully.',
      id: cuidToInt(company.id),
      data: {
        id: cuidToInt(company.id),
        title: company.companyName,
        description: company.location,
        address: company.location,
        phone: company.phoneNumber,
      },
    });
  } catch {
    return Response.json({ error: true, message: 'An error occurred while updating the company.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }
  const { id } = await params;

  const company = await prisma.contractor.findUnique({ where: { id } });
  if (!company) return Response.json({ error: true, message: 'Company not found or already deleted.', data: [] }, { status: 404 });

  if (auth.contractorId === id) {
    return Response.json({ error: true, message: 'Cannot delete the currently active company.', data: [] }, { status: 400 });
  }

  await prisma.contractor.delete({ where: { id } });
  return Response.json({ error: false, message: 'Company deleted successfully.', id, title: company.companyName, data: [] });
}