import { startOfDay, differenceInMinutes } from 'date-fns';
import { computeWorkedHours, ShiftShape } from './attendance-utils';
import type { BiometricRecord } from './biometric-service';

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