import { NextRequest } from 'next/server';
import { mobileAuth, cuidToInt } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }
  const { id } = await params;

  const license = await prisma.license.findUnique({ where: { id }, include: { site: true } });
  if (!license) return Response.json({ error: true, message: 'License not found.' }, { status: 404 });

  return Response.json({
    error: false,
    data: {
      id: license.id,
      license_number: license.licenseNumber,
      license_type: license.type,
      license_type_raw: license.type,
      issuing_authority: license.issuingAuthority,
      site: license.site ? { id: license.siteId, title: license.site.name } : null,
      issue_date: license.issueDate,
      expiry_date: license.expiryDate,
      license_status: license.status,
      document_path: license.fileName || null,
      created_at: license.createdAt,
      updated_at: license.updatedAt,
    },
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }
  const { id } = await params;

  const body = await request.json();
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.license_type !== undefined) data.type = body.license_type;
  if (body.license_number !== undefined) data.licenseNumber = body.license_number;
  if (body.issuing_authority !== undefined) data.issuingAuthority = body.issuing_authority;
  if (body.issue_date !== undefined) data.issueDate = new Date(body.issue_date);
  if (body.expiry_date !== undefined) data.expiryDate = new Date(body.expiry_date);
  if (body.category !== undefined) data.category = body.category;
  if (body.status !== undefined) data.status = body.status;

  const license = await prisma.license.update({ where: { id }, data, include: { site: true } });

  return Response.json({
    error: false,
    message: 'License updated successfully.',
    id: license.id,
    type: 'license',
    title: license.name,
    data: {
      id: license.id,
      license_number: license.licenseNumber,
      license_type: license.type,
      issuing_authority: license.issuingAuthority,
      site: license.site ? { id: license.siteId, title: license.site.name } : null,
      issue_date: license.issueDate,
      expiry_date: license.expiryDate,
      license_status: license.status,
      created_at: license.createdAt,
      updated_at: license.updatedAt,
    },
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }
  const { id } = await params;

  const license = await prisma.license.findUnique({ where: { id } });
  if (!license) return Response.json({ error: true, message: `License not found1.${id}` }, { status: 404 });

  await prisma.license.delete({ where: { id } });
  return Response.json({ error: false, message: 'License deleted successfully.', id, type: 'license', title: license.name });
}