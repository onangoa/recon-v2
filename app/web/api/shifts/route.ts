import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { requireContractorPermission } from '@/lib/require-permission';

export async function GET(request: NextRequest) {
  const permCheck = await requireContractorPermission(request, 'shifts:read');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const contractorId = permCheck.contractorId!;

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
  const permCheck = await requireContractorPermission(request, 'shifts:create');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const contractorId = permCheck.contractorId!;
    const body = await request.json();
    const { name, startTime, endTime, breakDuration, workingDays, allowOvertime, overtimeThresholdMinutes, overtimeRateType, overtimeRateAmount } = body;

    if (!name || !startTime || !endTime || !workingDays) {
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
        overtimeThresholdMinutes: overtimeThresholdMinutes != null ? parseFloat(overtimeThresholdMinutes) : 0,
        overtimeRateType: overtimeRateType || 'hourly',
        overtimeRateAmount: overtimeRateAmount != null ? parseFloat(overtimeRateAmount) : 0,
      }
    });

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
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
