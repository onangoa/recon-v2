import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const contractorId = auth.contractorId || auth.companyId;
  if (!contractorId) return mobileError('No company associated', 403);

  const siteIds = await prisma.site.findMany({
    where: { contractorId },
    select: { id: true },
  }).then(s => s.map(x => x.id));

  const supplierIds = await prisma.purchaseOrder.findMany({
    where: { siteId: { in: siteIds } },
    select: { supplierId: true },
    distinct: ['supplierId'],
  }).then(s => s.map(x => x.supplierId));

  const suppliers = await prisma.supplier.findMany({
    where: { id: { in: supplierIds.length > 0 ? supplierIds : undefined } },
    orderBy: { createdAt: 'desc' },
  });

  return mobileSuccess(suppliers.map(s => ({
    id: s.id,
    name: s.name,
    contact_person: s.contactPerson,
    email: s.email,
    phone: s.phone,
    address: s.address,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  })));
}

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const body = await request.json();
  if (!body.name) return mobileError('Supplier name is required', 400);

  const supplier = await prisma.supplier.create({
    data: {
      name: body.name,
      contactPerson: body.contact_person || null,
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
    },
  });

  return mobileSuccess({
    id: supplier.id,
    name: supplier.name,
  }, 'Supplier created successfully');
}