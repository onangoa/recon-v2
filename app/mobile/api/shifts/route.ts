import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import {
  mobileRequireContractorPermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  try {
    const permCheck = await mobileRequireContractorPermission(request, 'shifts:read');
    if (!permCheck.authorized) return permCheck.error!;

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

    return mobileSuccess(shifts);
  } catch (error) {
    console.error('Mobile fetch shifts error:', error);
    return mobileError('Failed to fetch shifts', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const permCheck = await mobileRequireContractorPermission(request, 'shifts:create');
    if (!permCheck.authorized) return permCheck.error!;

    const contractorId = permCheck.contractorId!;
    const body = await request.json();
    const { name, startTime, endTime, breakDuration, workingDays, allowOvertime } = body;

    if (!name || !startTime || !endTime || !workingDays) {
      return mobileError('Missing required fields', 400);
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
      userId: permCheck.userId || 'system',
      contractorId,
      action: 'CREATE',
      module: 'SHIFTS',
      description: `Created new shift: ${name}`,
      targetId: shift.id,
      details: shift
    });

    return mobileSuccess(shift, 'Shift created');
  } catch (error) {
    console.error('Mobile create shift error:', error);
    return mobileError('Failed to create shift', 500);
  }
}
