import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import {
  mobileRequireContractorPermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

// workingDays is stored as a String in the DB (JSON array or comma-separated
// list). Coerce whatever shape the client sends into a JSON string for
// storage, and parse it back into a List for responses.
function stringifyWorkingDays(value: any): string {
  if (value == null) return '[]';
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '[]';
    // Already a JSON array string?
    if (trimmed.startsWith('[')) {
      // Validate it parses; otherwise fall back to wrapping the raw string.
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return JSON.stringify(parsed);
      } catch (_) {
        // fall through to comma-split below
      }
    }
    // Treat as a comma-separated list ("MON,TUE,WED").
    const parts = trimmed
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    return JSON.stringify(parts);
  }
  return '[]';
}

function parseWorkingDays(value: any): any[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch (_) {}
    }
    return trimmed
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
  }
  return [];
}

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

    // Normalise workingDays: stored as a JSON string in the DB, expose it as
    // a List to match the mobile client's expectations.
    const mapped = shifts.map((s) => ({
      ...s,
      workingDays: parseWorkingDays(s.workingDays),
    }));

    return mobileSuccess(mapped);
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
    const { name, startTime, endTime, breakDuration, workingDays, allowOvertime, overtimeThresholdMinutes, overtimeRateType, overtimeRateAmount } = body;

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
        workingDays: stringifyWorkingDays(workingDays),
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
      details: { ...shift, workingDays: parseWorkingDays(shift.workingDays) }
    });

    return mobileSuccess({ ...shift, workingDays: parseWorkingDays(shift.workingDays) }, 'Shift created');
  } catch (error) {
    console.error('Mobile create shift error:', error);
    return mobileError('Failed to create shift', 500);
  }
}
