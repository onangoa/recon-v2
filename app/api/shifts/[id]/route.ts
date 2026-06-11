import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shift = await prisma.shift.findUnique({
      where: { id },
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
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, startTime, endTime, breakDuration, workingDays, allowOvertime } = body;

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
      userId: 'system',
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
  try {
    const { id } = await params;
    const shift = await prisma.shift.delete({
      where: { id }
    });

    await ActivityLogger.log({
      userId: 'system',
      contractorId: shift.contractorId,
      action: 'DELETE',
      module: 'SHIFTS',
      description: `Deleted shift: ${shift.name}`,
      targetId: shift.id
    });

    return NextResponse.json({ message: 'Shift deleted successfully' });
  } catch (error) {
    console.error('Failed to delete shift:', error);
    return NextResponse.json({ error: 'Failed to delete shift' }, { status: 500 });
  }
}
