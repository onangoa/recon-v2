import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const contractorId = auth.contractorId || auth.companyId;
  if (!contractorId) return mobileError('No company associated', 403);

  const siteId = request.nextUrl.searchParams.get('site_id') || auth.siteId;
  const siteIds = siteId
    ? [siteId]
    : await prisma.site.findMany({ where: { contractorId }, select: { id: true } }).then(s => s.map(x => x.id));

  const licenses = await prisma.license.findMany({
    where: { siteId: { in: siteIds } },
    orderBy: { createdAt: 'desc' },
  });

  return mobileSuccess(licenses.map(l => ({
    id: l.id,
    name: l.name,
    license_type: l.type,
    license_number: l.licenseNumber,
    issuing_authority: l.issuingAuthority,
    issue_date: l.issueDate,
    expiry_date: l.expiryDate,
    category: l.category,
    status: l.status,
    site_id: l.siteId,
    has_file: !!(l.fileName && l.fileData),
    created_at: l.createdAt,
    updated_at: l.updatedAt,
  })));
}

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const contractorId = auth.contractorId;
  if (!contractorId) return mobileError('No company associated', 403);

  const body = await request.json();
  const siteId = body.site_id || auth.siteId;
  if (!siteId) return mobileError('site_id is required', 400);

  const site = await prisma.site.findFirst({ where: { id: siteId, contractorId } });
  if (!site) return mobileError('Site not found', 404);

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

  return mobileSuccess({
    id: license.id,
    name: license.name,
    license_type: license.type,
    license_number: license.licenseNumber,
    expiry_date: license.expiryDate,
    site_id: license.siteId,
  }, 'License created successfully');
}