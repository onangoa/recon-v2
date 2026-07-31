import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { requireContractorPermission } from '@/lib/require-permission';
import { computeWorkedHours } from '@/lib/attendance-utils';
import { getRecords } from '@/lib/biometric-service';
import { transformRecordsToAttendance } from '@/lib/biometric-attendance';

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

    // ---- Biometric API source (preferred) ----
    // Attendance logs are pulled live from the device API (/api/getRecords)
    // and transformed into the same session shape the front-end expects.
    // Records are fetched from every device the contractor has configured
    // (Settings → Devices). If no devices are configured (or the biometric
    // API base URL is unset), we fall back to the database.
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

        // Pull a generous window of records newest-first from each configured
        // device; date filtering happens after transformation (the
        // /api/getRecords endpoint has no date filter).
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
              // A single offline device shouldn't blank the whole list.
              console.error(`Failed to fetch records from device ${device.sn}:`, err);
              break;
            }
          }
        }

        let attendances = transformRecordsToAttendance(collected, workers);

        // Apply the same filters the DB query used to.
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

        return NextResponse.json(attendances);
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
