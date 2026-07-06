import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import {
  mobileRequireContractorPermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'designations:read');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const designation = await prisma.designation.findFirst({
      where: { id, contractorId },
    });
    if (!designation) {
      return mobileError('Designation not found', 404);
    }
    return mobileSuccess(designation);
  } catch (error) {
    console.error('Mobile fetch designation error:', error);
    return mobileError('Failed to fetch designation', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'designations:update');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.designation.findFirst({
      where: { id, contractorId },
      select: { id: true }
    });
    if (!existing) {
      return mobileError('Designation not found', 404);
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

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId: designation.contractorId,
      action: 'UPDATE',
      module: 'DESIGNATIONS',
      description: `Updated designation: ${designation.title}`,
      targetId: designation.id,
      details: { title: designation.title, active: designation.isActive }
    });

    return mobileSuccess(designation, 'Designation updated');
  } catch (error) {
    console.error('Mobile update designation error:', error);
    return mobileError('Failed to update designation', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'designations:delete');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const existing = await prisma.designation.findFirst({
      where: { id, contractorId },
      select: { id: true, title: true, contractorId: true }
    });
    if (!existing) {
      return mobileError('Designation not found', 404);
    }

    await prisma.designation.delete({ where: { id } });

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId: existing.contractorId,
      action: 'DELETE',
      module: 'DESIGNATIONS',
      description: `Deleted designation: ${existing.title}`,
      targetId: existing.id,
    });

    return mobileSuccess(null, 'Designation deleted');
  } catch (error) {
    console.error('Mobile delete designation error:', error);
    return mobileError('Failed to delete designation', 500);
  }
}
