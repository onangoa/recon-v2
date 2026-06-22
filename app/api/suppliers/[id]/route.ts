import { NextRequest } from 'next/server';
import { mobileAuth, mobileSuccessOk } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const { id } = await params;

  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) return Response.json({ success: false, message: 'Supplier not found' }, { status: 404 });

  return mobileSuccessOk({
    id: supplier.id,
    name: supplier.name,
    contact_person: supplier.contactPerson,
    email: supplier.email,
    phone: supplier.phone,
    address: supplier.address,
    created_at: supplier.createdAt,
    updated_at: supplier.updatedAt,
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
  if (body.contact_person !== undefined) data.contactPerson = body.contact_person;
  if (body.email !== undefined) data.email = body.email;
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.address !== undefined) data.address = body.address;

  const supplier = await prisma.supplier.update({ where: { id }, data });
  return Response.json({
    success: true,
    supplier: {
      id: supplier.id,
      name: supplier.name,
      contact_person: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      created_at: supplier.createdAt,
      updated_at: supplier.updatedAt,
    },
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const { id } = await params;

  await prisma.supplier.delete({ where: { id } });
  return Response.json({ success: true, message: 'Supplier deleted successfully.' });
}