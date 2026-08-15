import { startOfDay, endOfDay, differenceInMinutes, isWithinInterval } from 'date-fns';
import { computeWorkedHours, ShiftShape } from './attendance-utils';
import { getRecords } from './biometric-service';
import type { BiometricRecord } from './biometric-service';
import { prisma } from './prisma';

/**
 * Pure transformation that turns raw biometric scan records (from the
 * /api/getRecords endpoint) into the attendance-session shape the front-end
 * already consumes — identical in behaviour to the biometric webhook, but
 * without writing to the database. This lets the attendance page render
 * "live" data straight from the device API instead of the database.
 */

const BREAK_THRESHOLD_MINUTES = 60;

export interface WorkerForTransform {
  id: string;
  name: string;
  enrollId: string | null;
  designation: { title: string } | null;
  shift: ShiftShape | null;
}

export interface AttendanceLogView {
  id: string;
  type: string;
  timestamp: string;
  deviceName: string | null;
}

export interface AttendanceView {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  totalHours: number;
  overtimeHours: number;
  lateHours: number;
  lateDays: number;
  status: string;
  notes: string | null;
  worker: {
    id: string;
    name: string;
    designation: { title: string } | null;
  };
  shift: {
    name: string;
    startTime: string;
    endTime: string;
  } | null;
  logs: AttendanceLogView[];
}

function parseLogTime(timeStr: string): Date {
  return new Date(timeStr.replace(' ', 'T'));
}

interface Built {
  date: Date;
  checkIn: Date | null;
  checkOut: Date | null;
  totalHours: number;
  overtimeHours: number;
  lateHours: number;
  lateDays: number;
  notes: string;
  logs: AttendanceLogView[];
}

/**
 * Group raw records (already sorted oldest-first) by worker-iso-date and
 * derive check-in / check-out / hours using the same heuristics as the
 * biometric webhook.
 */
export function transformRecordsToAttendance(
  records: BiometricRecord[],
  workers: WorkerForTransform[],
): AttendanceView[] {
  const workerByEnrollId = new Map<string, WorkerForTransform>();
  for (const w of workers) {
    if (w.enrollId) workerByEnrollId.set(String(w.enrollId), w);
  }

  // Group records by worker + day. Records arrive newest-first; sort ascending
  // so we can walk the timeline chronologically.
  const sorted = [...records].sort(
    (a, b) => +parseLogTime(a.records_time) - +parseLogTime(b.records_time)
  );

  const groups = new Map<string, { worker: WorkerForTransform; date: Date; records: BiometricRecord[] }>();

  for (const rec of sorted) {
    const worker = workerByEnrollId.get(String(rec.enroll_id));
    if (!worker) continue; // record for an unknown/unmapped enroll id

    const logTime = parseLogTime(rec.records_time);
    const day = startOfDay(logTime);
    const key = `${worker.id}_${day.toISOString()}`;

    let group = groups.get(key);
    if (!group) {
      group = { worker, date: day, records: [] };
      groups.set(key, group);
    }
    group.records.push(rec);
  }

  const out: AttendanceView[] = [];

  for (const group of groups.values()) {
    const built = buildSession(group.records, group.worker.shift);
    out.push({
      id: `${group.worker.id}_${group.date.toISOString()}`,
      date: group.date.toISOString(),
      checkIn: built.checkIn ? built.checkIn.toISOString() : null,
      checkOut: built.checkOut ? built.checkOut.toISOString() : null,
      totalHours: built.totalHours,
      overtimeHours: built.overtimeHours,
      lateHours: built.lateHours,
      lateDays: built.lateDays,
      status: 'Present',
      notes: built.notes,
      worker: {
        id: group.worker.id,
        name: group.worker.name,
        designation: group.worker.designation,
      },
      shift: group.worker.shift
        ? {
            name: (group.worker.shift as any).name || 'Shift',
            startTime: group.worker.shift.startTime,
            endTime: group.worker.shift.endTime,
          }
        : null,
      logs: built.logs,
    });
  }

  // Newest date first, then by worker name for stable ordering.
  out.sort((a, b) => {
    const d = +new Date(b.date) - +new Date(a.date);
    if (d !== 0) return d;
    return a.worker.name.localeCompare(b.worker.name);
  });

  return out;
}

function buildSession(records: BiometricRecord[], shift: ShiftShape | null): Built {
  // records already chronologically ascending
  let checkIn: Date | null = null;
  let checkOut: Date | null = null;
  let totalHours = 0;
  let overtimeHours = 0;
  let lateHours = 0;
  let lateDays = 0;
  const notes: string[] = [];
  const logs: AttendanceLogView[] = [];

  for (const rec of records) {
    const time = parseLogTime(rec.records_time);
    const device = rec.device_serial_num || null;

    // intOut === 1 => explicit out, otherwise infer by toggling.
    if (!checkIn) {
      checkIn = time;
      logs.push({ id: `in_${rec.id}`, type: 'IN', timestamp: time.toISOString(), deviceName: device });
      notes.push(`Biometric In${device ? ` (${device})` : ''}`);
    } else if (!checkOut) {
      checkOut = time;
      logs.push({ id: `out_${rec.id}`, type: 'OUT', timestamp: time.toISOString(), deviceName: device });
      if (time > checkIn) {
        const worked = computeWorkedHours(checkIn, time, shift);
        totalHours = worked.totalHours;
        overtimeHours = worked.overtimeHours;
        lateHours = worked.lateHours;
        lateDays = worked.lateDays;
      }
      notes.push(`Biometric Out${device ? ` (${device})` : ''}`);
    } else {
      // Re-entry after a closed session. If within the break window, treat as
      // break-end and resume; otherwise start a new outer session.
      const gap = differenceInMinutes(time, checkOut);
      if (gap <= BREAK_THRESHOLD_MINUTES) {
        checkOut = null;
        overtimeHours = 0;
        totalHours = 0;
        logs.push({ id: `brk_${rec.id}`, type: 'BREAK_END', timestamp: time.toISOString(), deviceName: device });
        notes.push(`Break ended${device ? ` (${device})` : ''}`);
      } else {
        checkIn = time;
        checkOut = null;
        totalHours = 0;
        overtimeHours = 0;
        lateHours = 0;
        lateDays = 0;
        logs.push({ id: `in_${rec.id}`, type: 'IN', timestamp: time.toISOString(), deviceName: device });
        notes.push(`New session${device ? ` (${device})` : ''}`);
      }
    }
  }

  return {
    date: records.length ? startOfDay(parseLogTime(records[0].records_time)) : new Date(),
    checkIn,
    checkOut,
    totalHours,
    overtimeHours,
    lateHours,
    lateDays,
    notes: notes.join(' | '),
    logs,
  };
}

/**
 * Pull attendance records from all active biometric devices for a contractor
 * and persist them to the Attendance table so downstream processes (payroll)
 * can query the database instead of the live device API.
 *
 * This mirrors the GET /web/api/attendance "biometric API source" flow but
 * writes the transformed records to the database, closing the gap between
 * what the attendance page shows (live from device) and what payroll reads
 * (from the database).
 */
export async function syncBiometricToDatabase(
  contractorId: string,
  from?: Date,
  to?: Date,
): Promise<{ synced: number; devices: number }> {
  if (!process.env.BIOMETRIC_API_BASE_URL) {
    return { synced: 0, devices: 0 };
  }

  const devices = await prisma.biometricDevice.findMany({
    where: { contractorId, isActive: true },
    select: { sn: true, name: true },
  });

  if (devices.length === 0) {
    return { synced: 0, devices: 0 };
  }

  const workers = await prisma.worker.findMany({
    where: { contractorId },
    select: {
      id: true,
      name: true,
      enrollId: true,
      shiftId: true,
      designation: { select: { title: true } },
      shift: true,
    },
  });

  const workerShiftId = new Map(workers.map((w) => [w.id, w.shiftId]));

  const pageSize = 500;
  const collected: BiometricRecord[] = [];

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

  const workersForTransform: WorkerForTransform[] = workers.map((w) => ({
    id: w.id,
    name: w.name,
    enrollId: w.enrollId,
    designation: w.designation,
    shift: (w.shift as unknown as ShiftShape) || null,
  }));

  let views = transformRecordsToAttendance(collected, workersForTransform);

  if (from && to) {
    const lo = startOfDay(from);
    const hi = endOfDay(to);
    views = views.filter((v) => isWithinInterval(new Date(v.date), { start: lo, end: hi }));
  }

  let synced = 0;
  for (const v of views) {
    const date = new Date(v.date);
    const checkIn = v.checkIn ? new Date(v.checkIn) : null;
    const checkOut = v.checkOut ? new Date(v.checkOut) : null;

    try {
      await prisma.attendance.upsert({
        where: { workerId_date: { workerId: v.worker.id, date } },
        create: {
          contractorId,
          workerId: v.worker.id,
          shiftId: workerShiftId.get(v.worker.id) || null,
          date,
          checkIn,
          checkOut,
          totalHours: v.totalHours,
          overtimeHours: v.overtimeHours,
          lateHours: v.lateHours,
          lateDays: v.lateDays,
          status: v.status,
          notes: v.notes,
        },
        update: {
          checkIn,
          checkOut,
          totalHours: v.totalHours,
          overtimeHours: v.overtimeHours,
          lateHours: v.lateHours,
          lateDays: v.lateDays,
          status: v.status,
          notes: v.notes,
        },
      });
      synced++;
    } catch (err) {
      console.error(`Failed to sync attendance for worker ${v.worker.id}:`, err);
    }
  }

  return { synced, devices: devices.length };
}