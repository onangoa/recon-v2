import { NextRequest } from 'next/server';
import { mobileAuth, mobileSuccessOk } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }

  const contractorId = auth.contractorId || auth.companyId;
  if (!contractorId) return Response.json({ success: false, message: 'No company associated' }, { status: 403 });

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

  return Response.json(suppliers.map(s => ({
    id: s.id,
    name: s.name,
    contact_person: s.contactPerson,
    email: s.email,
    phone: s.phone,
  })));
}

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }

  const body = await request.json();
  if (!body.name) return Response.json({ success: false, message: 'Supplier name is required' }, { status: 400 });

  const supplier = await prisma.supplier.create({
    data: {
      name: body.name,
      contactPerson: body.contact_person || null,
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
    },
  });

  return Response.json({
    success: true,
    message: 'Supplier created successfully.',
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