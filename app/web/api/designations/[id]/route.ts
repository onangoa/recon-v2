import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { requireContractorPermission } from '@/lib/require-permission';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireContractorPermission(request, 'designations:read');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const contractorId = permCheck.contractorId!;
    const { id } = await params;
    const designation = await prisma.designation.findFirst({
      where: { id, contractorId },
    });
    if (!designation) {
      return NextResponse.json({ error: 'Designation not found' }, { status: 404 });
    }
    return NextResponse.json(designation);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch designation' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireContractorPermission(request, 'designations:update');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.designation.findFirst({
      where: { id, contractorId },
      select: { id: true }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Designation not found' }, { status: 404 });
    }

    const designation = await prisma.designation.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        salary: body.salary,
        paymentFrequency: body.paymentFrequency,
        isActive: body.isActive,
      },
    });

    // Record activity log
    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId: designation.contractorId,
      action: 'UPDATE',
      module: 'DESIGNATIONS',
      description: `Updated designation: ${designation.title}`,
      targetId: designation.id,
      details: { title: designation.title, active: designation.isActive }
    });

    return NextResponse.json(designation);
  } catch (error) {
    console.error('Failed to update designation:', error);
    return NextResponse.json({ error: 'Failed to update designation' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireContractorPermission(request, 'designations:delete');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const existing = await prisma.designation.findFirst({
      where: { id, contractorId },
      select: { id: true, title: true, contractorId: true }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Designation not found' }, { status: 404 });
    }

    await prisma.designation.delete({ where: { id } });

    // Record activity log
    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId: existing.contractorId,
      action: 'DELETE',
      module: 'DESIGNATIONS',
      description: `Deleted designation: ${existing.title}`,
      targetId: existing.id,
    });

    return NextResponse.json({ message: 'Designation deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete designation' }, { status: 500 });
  }
}