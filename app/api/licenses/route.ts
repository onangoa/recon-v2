import { NextRequest } from 'next/server';
import { mobileAuth, cuidToInt } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }

  const contractorId = auth.contractorId || auth.companyId;
  if (!contractorId) return Response.json({ error: 'No company selected.' }, { status: 400 });

  const siteId = request.nextUrl.searchParams.get('site_id') || auth.siteId;
  const siteIds = siteId
    ? [siteId]
    : await prisma.site.findMany({ where: { contractorId }, select: { id: true } }).then(s => s.map(x => x.id));

  const licenses = await prisma.license.findMany({
    where: { siteId: { in: siteIds } },
    orderBy: { createdAt: 'desc' },
  });

  return Response.json({
    rows: licenses.map(l => ({
      id: l.id,
      license_number: l.licenseNumber,
      license_type: l.type,
      issuing_authority: l.issuingAuthority,
      site: l.siteId,
      issue_date: l.issueDate,
      expiry_date: l.expiryDate,
      license_status: l.status,
      obj_status: l.status,
      created_at: l.createdAt,
      updated_at: l.updatedAt,
      actions: '',
    })),
    total: licenses.length,
  });
}

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }

  const contractorId = auth.contractorId;
  if (!contractorId) return Response.json({ error: 'No company selected.' }, { status: 400 });

  const body = await request.json();
  const siteId = body.site_id || auth.siteId;
  if (!siteId) return Response.json({ error: true, message: 'site_id is required' }, { status: 400 });

  const site = await prisma.site.findFirst({ where: { id: siteId, contractorId } });
  if (!site) return Response.json({ error: true, message: 'Site not found' }, { status: 404 });

  const license = await prisma.license.create({
    data: {
      name: body.name,
      type: body.license_type || body.type || null,
      licenseNumber: body.license_number || `LIC-${Date.now()}`,
      issuingAuthority: body.issuing_authority || null,
      issueDate: body.issue_date ? new Date(body.issue_date) : null,
      expiryDate: body.expiry_date ? new Date(body.expiry_date) : null,
      category: body.category || null,
      status: body.status || 'active',
      siteId,
    },
  });

  return Response.json({
    error: false,
    message: 'License created successfully.',
    id: license.id,
    type: 'license',
    title: license.name,
    data: {
      id: license.id,
      license_number: license.licenseNumber,
      license_type: license.type,
      issuing_authority: license.issuingAuthority,
      site: { id: license.siteId, title: site.name },
      issue_date: license.issueDate,
      expiry_date: license.expiryDate,
      license_status: license.status,
      document_path: null,
      created_at: license.createdAt,
      updated_at: license.updatedAt,
    },
  });
}