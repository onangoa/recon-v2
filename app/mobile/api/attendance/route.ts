import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import {
  mobileRequireContractorPermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';
import { computeWorkedHours } from '@/lib/attendance-utils';
import { getRecords } from '@/lib/biometric-service';
import { transformRecordsToAttendance } from '@/lib/biometric-attendance';

export async function GET(request: NextRequest) {
  try {
    const permCheck = await mobileRequireContractorPermission(request, 'attendance:read');
    if (!permCheck.authorized) return permCheck.error!;
    const contractorId = permCheck.contractorId!;
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('workerId');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // ---- Biometric API source (preferred) ----
    // Same logic as the web API: pull attendance live from biometric devices
    // when BIOMETRIC_API_BASE_URL is set and the contractor has active devices.
    // Falls back to the database when biometric is unavailable.
    if (process.env.BIOMETRIC_API_BASE_URL) {
      const devices = await prisma.biometricDevice.findMany({
        where: { contractorId, isActive: true },
        select: { sn: true, name: true },
      });

      if (devices.length > 0) {
        const workers = await prisma.worker.findMany({
          where: { contractorId },
          select: {
            id: true,
            name: true,
            enrollId: true,
            designation: { select: { title: true } },
            shift: true,
          },
        });

        const pageSize = 500;
        const collected: Awaited<ReturnType<typeof getRecords>>['records'] = [];

        for (const device of devices) {
          let pn = 1;
          for (let i = 0; i < 5; i++) {
            try {
              const page = await getRecords(device.sn, { pn, pageSize });
              if (!page.records || page.records.length === 0) break;
              collected.push(...page.records);
              if (page.records.length < pageSize || collected.length >= page.total) break;
              pn++;
            } catch (err) {
              console.error(`Failed to fetch records from device ${device.sn}:`, err);
              break;
            }
          }
        }

        let attendances = transformRecordsToAttendance(collected, workers);

        if (workerId) attendances = attendances.filter((a) => a.worker.id === workerId);
        if (date) {
          const day = new Date(date);
          const lo = startOfDay(day);
          const hi = endOfDay(day);
          attendances = attendances.filter((a) => {
            const d = new Date(a.date);
            return d >= lo && d <= hi;
          });
        } else if (startDate && endDate) {
          const lo = new Date(startDate);
          const hi = new Date(endDate);
          attendances = attendances.filter((a) => isWithinInterval(new Date(a.date), { start: lo, end: hi }));
        }

        return mobileSuccess(attendances);
      }
    }

    // ---- Database fallback ----
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

    return mobileSuccess(attendances);
  } catch (error) {
    console.error('Failed to fetch attendance:', error);
    return mobileError('Failed to fetch attendance', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const permCheck = await mobileRequireContractorPermission(request, 'attendance:create');
    if (!permCheck.authorized) return permCheck.error!;
    const contractorId = permCheck.contractorId!;

    const body = await request.json();
    const { workerId, type, notes } = body;

    if (!workerId || !type) {
      return mobileError('Missing required fields', 400);
    }

    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      include: { shift: true }
    });

    if (!worker) {
      return mobileError('Worker not found', 404);
    }

    if (worker.contractorId !== contractorId) {
      return mobileError('Access denied', 403);
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
        return mobileError('Already clocked in today', 400);
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
        return mobileError('Not clocked in today', 400);
      }

      if (attendance.checkOut) {
        return mobileError('Already clocked out today', 400);
      }

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

    if (!attendance) {
      return mobileError('Attendance record not created', 500);
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

    return mobileSuccess(attendance, 'Attendance recorded');
  } catch (error) {
    console.error('Failed to record attendance:', error);
    return mobileError('Failed to record attendance', 500);
  }
}
