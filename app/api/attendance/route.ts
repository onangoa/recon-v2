import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { startOfDay, endOfDay, differenceInMinutes, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractorId = searchParams.get('contractorId');
    const workerId = searchParams.get('workerId');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!contractorId) {
      return NextResponse.json({ error: 'Contractor ID required' }, { status: 400 });
    }

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
        shift: true
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
    const body = await request.json();
    const { workerId, contractorId, type, notes } = body; // type: 'CLOCK_IN' or 'CLOCK_OUT'

    if (!workerId || !contractorId || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      include: { shift: true }
    });

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
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

      // Calculate hours
      const checkIn = new Date(attendance.checkIn);
      const checkOut = today;
      const totalMinutes = differenceInMinutes(checkOut, checkIn);
      const totalHours = totalMinutes / 60;

      let overtimeHours = 0;
      if (worker.shift) {
        // Simple overtime calculation: anything beyond shift duration
        const shiftStart = worker.shift.startTime.split(':').map(Number);
        const shiftEnd = worker.shift.endTime.split(':').map(Number);
        
        // Calculate shift duration in minutes
        let shiftDurationMinutes = (shiftEnd[0] * 60 + shiftEnd[1]) - (shiftStart[0] * 60 + shiftStart[1]);
        if (shiftDurationMinutes < 0) shiftDurationMinutes += 24 * 60; // Handle overnight shifts
        
        // Subtract break
        shiftDurationMinutes -= worker.shift.breakDuration;
        
        const shiftDurationHours = shiftDurationMinutes / 60;
        
        if (worker.shift.allowOvertime && totalHours > shiftDurationHours) {
          overtimeHours = totalHours - shiftDurationHours;
        }
      }

      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOut: today,
          totalHours,
          overtimeHours,
          notes: notes || attendance.notes
        }
      });
    }

    await ActivityLogger.log({
      userId: 'system',
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
