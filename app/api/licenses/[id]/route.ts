import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id } = await params;

  const license = await prisma.license.findUnique({ where: { id } });
  if (!license) return mobileError('License not found', 404);

  return mobileSuccess({
    id: license.id,
    name: license.name,
    license_type: license.type,
    license_number: license.licenseNumber,
    issuing_authority: license.issuingAuthority,
    issue_date: license.issueDate,
    expiry_date: license.expiryDate,
    category: license.category,
    status: license.status,
    site_id: license.siteId,
    has_file: !!(license.fileName && license.fileData),
    created_at: license.createdAt,
    updated_at: license.updatedAt,
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
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

  const license = await prisma.license.update({ where: { id }, data });
  return mobileSuccess({
    id: license.id,
    name: license.name,
    license_type: license.type,
  }, 'License updated successfully');
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id } = await params;

  await prisma.license.delete({ where: { id } });
  return mobileSuccess(null, 'License deleted successfully');
}