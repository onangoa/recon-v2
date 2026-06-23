import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { startOfDay, endOfDay } from 'date-fns';
import { requireContractorPermission } from '@/lib/require-permission';
import { computeWorkedHours } from '@/lib/attendance-utils';

export async function GET(request: NextRequest) {
  try {
const permCheck = await requireContractorPermission(request, 'attendance:read');
    if (!permCheck.authorized) return permCheck.error;
    const contractorId = permCheck.contractorId!;
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('workerId');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = { contractorId };
    if (workerId) where.workerId = workerId;
    if (date) {
      const day = new Date(date);
      where.date = {
        gte: startOfDay(day),
        lte: endOfDay(day)
      };
    } else if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        worker: {
          select: { name: true, designation: { select: { title: true } } }
        },
        shift: true,
        logs: {
          orderBy: { timestamp: 'asc' }
        }
      },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error('Failed to fetch attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
const permCheck = await requireContractorPermission(request, 'attendance:create');
    if (!permCheck.authorized) return permCheck.error;
    const contractorId = permCheck.contractorId!;

    const body = await request.json();
    const { workerId, type, notes } = body; // type: 'CLOCK_IN' or 'CLOCK_OUT'

    if (!workerId || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      include: { shift: true }
    });

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    if (worker.contractorId !== contractorId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const today = new Date();
    const todayStart = startOfDay(today);

    let attendance = await prisma.attendance.findUnique({
      where: {
        workerId_date: {
          workerId,
          date: todayStart
        }
      }
    });

    if (type === 'CLOCK_IN') {
      if (attendance && attendance.checkIn) {
        return NextResponse.json({ error: 'Already clocked in today' }, { status: 400 });
      }

      if (!attendance) {
        attendance = await prisma.attendance.create({
          data: {
            contractorId,
            workerId,
            shiftId: worker.shiftId,
            date: todayStart,
            checkIn: today,
            status: 'Present'
          }
        });
      } else {
        attendance = await prisma.attendance.update({
          where: { id: attendance.id },
          data: {
            checkIn: today,
            shiftId: worker.shiftId,
            status: 'Present'
          }
        });
      }
    } else if (type === 'CLOCK_OUT') {
      if (!attendance || !attendance.checkIn) {
        return NextResponse.json({ error: 'Not clocked in today' }, { status: 400 });
      }

      if (attendance.checkOut) {
        return NextResponse.json({ error: 'Already clocked out today' }, { status: 400 });
      }

      // Calculate hours, overtime and lateness
      const checkIn = new Date(attendance.checkIn);
      const checkOut = today;
      const worked = computeWorkedHours(checkIn, checkOut, worker.shift);

      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOut: today,
          totalHours: worked.totalHours,
          overtimeHours: worked.overtimeHours,
          lateHours: worked.lateHours,
          lateDays: worked.lateDays,
          notes: notes || attendance.notes
        }
      });
    }

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId,
      action: type,
      module: 'ATTENDANCE',
      description: `${type} for worker ${worker.name}`,
      targetId: attendance.id,
      details: attendance
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Failed to record attendance:', error);
    return NextResponse.json({ error: 'Failed to record attendance' }, { status: 500 });
  }
}
