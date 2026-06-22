import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { requireContractorPermission } from '@/lib/require-permission';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireContractorPermission(request, 'shifts:read');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const contractorId = permCheck.contractorId!;
    const { id } = await params;
    const shift = await prisma.shift.findFirst({
      where: { id, contractorId },
      include: {
        workers: true
      }
    });

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    return NextResponse.json(shift);
  } catch (error) {
    console.error('Failed to fetch shift:', error);
    return NextResponse.json({ error: 'Failed to fetch shift' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireContractorPermission(request, 'shifts:update');
  if (!permCheck.authorized) return permCheck.error;
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
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
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

    return NextResponse.json(shift);
  } catch (error) {
    console.error('Failed to update shift:', error);
    return NextResponse.json({ error: 'Failed to update shift' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireContractorPermission(request, 'shifts:delete');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const existing = await prisma.shift.findFirst({
      where: { id, contractorId },
      select: { id: true, name: true, contractorId: true }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
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

    return NextResponse.json({ message: 'Shift deleted successfully' });
  } catch (error) {
    console.error('Failed to delete shift:', error);
    return NextResponse.json({ error: 'Failed to delete shift' }, { status: 500 });
  }
}