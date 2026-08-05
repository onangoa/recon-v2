import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequirePermission(request, 'suppliers:read');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const { id } = await params;
    // Restrict to suppliers owned by this contractor (or shared globals).
    const where: any = { id };
    if (permCheck.contractorId) {
      where.OR = [{ contractorId: permCheck.contractorId }, { contractorId: null }];
    }
    const supplier = await prisma.supplier.findFirst({ where });

    if (!supplier) {
      return mobileError('Supplier not found', 404);
    }

    return mobileSuccess(supplier);
  } catch (error) {
    console.error('Mobile fetch supplier error:', error);
    return mobileError('Failed to fetch supplier', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequirePermission(request, 'suppliers:update');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.name) {
      return mobileError('Name is required', 400);
    }

    const existing = permCheck.contractorId
      ? await prisma.supplier.findFirst({ where: { id, OR: [{ contractorId: permCheck.contractorId }, { contractorId: null }] } })
      : await prisma.supplier.findUnique({ where: { id } });

    if (!existing) {
      return mobileError('Supplier not found', 404);
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: body.name,
        contactPerson: body.contactPerson || null,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
      },
    });

    return mobileSuccess(supplier, 'Supplier updated');
  } catch (error) {
    console.error('Mobile update supplier error:', error);
    return mobileError('Failed to update supplier', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequirePermission(request, 'suppliers:delete');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const { id } = await params;

    const existing = permCheck.contractorId
      ? await prisma.supplier.findFirst({ where: { id, OR: [{ contractorId: permCheck.contractorId }, { contractorId: null }] } })
      : await prisma.supplier.findUnique({ where: { id } });

    if (!existing) {
      return mobileError('Supplier not found', 404);
    }

    await prisma.supplier.delete({
      where: { id }
    });

    return mobileSuccess(null, 'Supplier deleted');
  } catch (error) {
    console.error('Mobile delete supplier error:', error);
    return mobileError('Failed to delete supplier', 500);
  }
}
