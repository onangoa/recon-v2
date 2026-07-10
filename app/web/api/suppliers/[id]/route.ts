import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requirePermission(request, 'suppliers:read');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const { id } = await params;
    // Only return suppliers owned by this contractor (or shared globals).
    const where: any = { id };
    if (permCheck.contractorId) {
      where.OR = [{ contractorId: permCheck.contractorId }, { contractorId: null }];
    }
    const supplier = await prisma.supplier.findFirst({ where });

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Failed to fetch supplier:', error);
    return NextResponse.json({ error: 'Failed to fetch supplier' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requirePermission(request, 'suppliers:update');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Restrict updates to suppliers owned by this contractor. Shared global
    // suppliers (contractorId = null) are read-only for individual contractors.
    const existing = permCheck.contractorId
      ? await prisma.supplier.findFirst({ where: { id, contractorId: permCheck.contractorId } })
      : await prisma.supplier.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
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

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Failed to update supplier:', error);
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requirePermission(request, 'suppliers:delete');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const { id } = await params;

    // Restrict deletes to suppliers owned by this contractor.
    const existing = permCheck.contractorId
      ? await prisma.supplier.findFirst({ where: { id, contractorId: permCheck.contractorId } })
      : await prisma.supplier.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    await prisma.supplier.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete supplier:', error);
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
  }
}