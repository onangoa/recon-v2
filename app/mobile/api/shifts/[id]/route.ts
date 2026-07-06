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
  const permCheck = await mobileRequireContractorPermission(request, 'shifts:read');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const shift = await prisma.shift.findFirst({
      where: { id, contractorId },
      include: {
        workers: true
      }
    });

    if (!shift) {
      return mobileError('Shift not found', 404);
    }

    return mobileSuccess(shift);
  } catch (error) {
    console.error('Mobile fetch shift error:', error);
    return mobileError('Failed to fetch shift', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'shifts:update');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, startTime, endTime, breakDuration, workingDays, allowOvertime } = body;

    const existing = await prisma.shift.findFirst({
      where: { id, contractorId },
      select: { id: true }
    });
    if (!existing) {
      return mobileError('Shift not found', 404);
    }

    const shift = await prisma.shift.update({
      where: { id },
      data: {
        name,
        startTime,
        endTime,
        breakDuration: breakDuration !== undefined ? parseFloat(breakDuration) : undefined,
        workingDays,
        allowOvertime,
      }
    });

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId: shift.contractorId,
      action: 'UPDATE',
      module: 'SHIFTS',
      description: `Updated shift: ${shift.name}`,
      targetId: shift.id,
      details: shift
    });

    return mobileSuccess(shift, 'Shift updated');
  } catch (error) {
    console.error('Mobile update shift error:', error);
    return mobileError('Failed to update shift', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'shifts:delete');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const existing = await prisma.shift.findFirst({
      where: { id, contractorId },
      select: { id: true, name: true, contractorId: true }
    });
    if (!existing) {
      return mobileError('Shift not found', 404);
    }

    await prisma.shift.delete({ where: { id } });

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId: existing.contractorId,
      action: 'DELETE',
      module: 'SHIFTS',
      description: `Deleted shift: ${existing.name}`,
      targetId: existing.id
    });

    return mobileSuccess(null, 'Shift deleted successfully');
  } catch (error) {
    console.error('Mobile delete shift error:', error);
    return mobileError('Failed to delete shift', 500);
  }
}
