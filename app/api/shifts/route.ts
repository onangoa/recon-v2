import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractorId = searchParams.get('contractorId');

    if (!contractorId) {
      return NextResponse.json({ error: 'Contractor ID required' }, { status: 400 });
    }

    const shifts = await prisma.shift.findMany({
      where: { contractorId },
      include: {
        _count: {
          select: { workers: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(shifts);
  } catch (error) {
    console.error('Failed to fetch shifts:', error);
    return NextResponse.json({ error: 'Failed to fetch shifts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractorId, name, startTime, endTime, breakDuration, workingDays, allowOvertime } = body;

    if (!contractorId || !name || !startTime || !endTime || !workingDays) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const shift = await prisma.shift.create({
      data: {
        contractorId,
        name,
        startTime,
        endTime,
        breakDuration: parseFloat(breakDuration) || 0,
        workingDays,
        allowOvertime: allowOvertime ?? true,
      }
    });

    await ActivityLogger.log({
      userId: 'system', // In a real app, get from session
      contractorId,
      action: 'CREATE',
      module: 'SHIFTS',
      description: `Created new shift: ${name}`,
      targetId: shift.id,
      details: shift
    });

    return NextResponse.json(shift, { status: 201 });
  } catch (error) {
    console.error('Failed to create shift:', error);
    return NextResponse.json({ error: 'Failed to create shift' }, { status: 500 });
  }
}
