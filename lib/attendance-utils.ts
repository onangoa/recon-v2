import { differenceInMinutes } from 'date-fns';
import type { Attendance } from '../prisma/generated/client';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export interface ShiftShape {
  startTime: string;   // "HH:mm"
  endTime: string;     // "HH:mm"
  breakDuration: number; // minutes
  allowOvertime: boolean;
  /** Free-form working days, e.g. "Mon,Tue,Wed,Thu,Fri". Null/empty = every day. */
  workingDays?: string | null;
  /** Minutes past end time before overtime kicks in (0 = immediate). */
  overtimeThresholdMinutes?: number;
  /** How overtime pay is calculated: "hourly" (multiplied by hourly rate) or "fixed" (flat amount per hour). */
  overtimeRateType?: string;
  /** The amount used for overtime pay. For "hourly" this is a multiplier (e.g. 1.5). For "fixed" this is KES per hour. */
  overtimeRateAmount?: number;
}

export interface WorkedHours {
  /** Wall-clock hours between check-in and check-out (no break subtraction). */
  totalHours: number;
  /** Hours worked beyond the shift's net duration (after break). 0 if overtime not allowed or not exceeded. */
  overtimeHours: number;
  /** Net hours the shift expects per day (duration minus break). */
  expectedHours: number;
  /** Minutes the worker arrived after the shift's scheduled start (0 if on time / no shift / no check-in). */
  lateMinutes: number;
  /** lateMinutes expressed in hours. */
  lateHours: number;
  /** 1 if the worker was late (lateMinutes > 0), else 0 — used to count late days. */
  lateDays: number;
}

/**
 * Compute worked hours, overtime and lateness from a check-in/check-out pair
 * and the worker's shift. Centralised so the biometric webhook, the manual
 * clock route and payroll aggregation all share identical rules.
 *
 * Rules:
 *  - `totalHours` = (checkOut - checkIn) in hours (wall-clock; includes any
 *    break the worker took while on the clock).
 *  - `expectedHours` = (shift end - shift start, overnight-wrapped) - break.
 *  - `overtimeHours` = hours the worker stayed past (shift end + threshold)
 *    when shift.allowOvertime. The threshold is the grace period past the
 *    scheduled end time before overtime starts counting. 0 if the worker
 *    left before the threshold boundary.
 *  - `lateMinutes` = minutes checkIn occurs after shift start (0 if on time,
 *    or if no shift / no checkIn).
 */
export function computeWorkedHours(
  checkIn: Date,
  checkOut: Date,
  shift: ShiftShape | null | undefined,
): WorkedHours {
  // Truncate sub-minute precision so overtime/lateness match the displayed
  // clock times (which only show hours:minutes, not seconds).
  const ci = new Date(checkIn);
  ci.setSeconds(0, 0);
  const co = new Date(checkOut);
  co.setSeconds(0, 0);

  const totalMinutes = Math.max(0, differenceInMinutes(co, ci));
  const totalHours = totalMinutes / 60;

  if (!shift) {
    return {
      totalHours,
      overtimeHours: 0,
      expectedHours: 0,
      lateMinutes: 0,
      lateHours: 0,
      lateDays: 0,
    };
  }

  const start = parseHHMM(shift.startTime);
  const end = parseHHMM(shift.endTime);
  let shiftMinutes = end - start;
  if (shiftMinutes < 0) shiftMinutes += 24 * 60; // overnight wrap
  const shiftNetMinutes = Math.max(0, shiftMinutes - shift.breakDuration);
  const expectedHours = shiftNetMinutes / 60;

  // Overtime: the threshold defines a grace period past the shift's
  // scheduled END TIME. We compute the actual shift-end DateTime on the
  // check-in day, add the threshold, and measure how far past that the
  // worker checked out. This avoids mixing break-inclusive wall-clock
  // hours with break-exclusive net hours (which produced false positives
  // when totalHours included a 60-min break but expectedHours didn't).
  const thresholdMin = shift.overtimeThresholdMinutes || 0;

  let overtimeHours = 0;
  if (shift.allowOvertime && shiftMinutes > 0) {
    // Anchor shift start to the check-in calendar day at midnight, then
    // offset by the shift start minutes-from-midnight. setMinutes handles
    // overflow (>59) by rolling into hours/date automatically.
    const midnight = new Date(ci);
    midnight.setHours(0, 0, 0, 0);

    const shiftEnd = new Date(midnight.getTime() + (start + shiftMinutes) * 60 * 1000);
    const overtimeStart = new Date(shiftEnd.getTime() + thresholdMin * 60 * 1000);

    if (co > overtimeStart) {
      overtimeHours = (co.getTime() - overtimeStart.getTime()) / (1000 * 60 * 60);
    }
  }

  // Lateness: compare the check-in time-of-day to the shift start.
  const checkInMinutes = ci.getHours() * 60 + ci.getMinutes();
  let lateMinutes = checkInMinutes - start;
  // If the shift wraps past midnight and the worker checked in before the
  // late-night start, treat relative to the wrapped start.
  if (shiftMinutes < 24 * 60 && lateMinutes < -12 * 60) {
    lateMinutes += 24 * 60;
  }
  if (lateMinutes < 0) lateMinutes = 0;

  return {
    totalHours,
    overtimeHours,
    expectedHours,
    lateMinutes,
    lateHours: lateMinutes / 60,
    lateDays: lateMinutes > 0 ? 1 : 0,
  };
}

/** Parse "HH:mm" into minutes since midnight. Returns 0 for falsy input. */
export function parseHHMM(value: string | null | undefined): number {
  if (!value) return 0;
  const [h, m] = value.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Net shift hours per day (duration - break, overnight-wrapped). */
export function shiftNetHours(shift: ShiftShape | null | undefined): number {
  if (!shift) return 0;
  const start = parseHHMM(shift.startTime);
  const end = parseHHMM(shift.endTime);
  let minutes = end - start;
  if (minutes < 0) minutes += 24 * 60;
  return Math.max(0, minutes - shift.breakDuration) / 60;
}

/** Parse a free-form working-days string ("Mon,Tue,...") into a set of 0-6 indexes. */
export function parseWorkingDays(workingDays: string | null | undefined): Set<number> | null {
  if (!workingDays) return null;
  const tokens = workingDays
    .split(/[,\s]+/)
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return null;
  const set = new Set<number>();
  for (const t of tokens) {
    const idx = DAY_KEYS.indexOf(t.slice(0, 3) as any);
    if (idx >= 0) set.add(idx);
  }
  return set.size > 0 ? set : null;
}

/** Count working days (by weekday name) falling within [start, end] inclusive. */
export function countExpectedDays(
  start: Date,
  end: Date,
  workingDays: string | null | undefined,
): number {
  const mask = parseWorkingDays(workingDays);
  let count = 0;
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const stop = new Date(end);
  stop.setHours(0, 0, 0, 0);
  while (cur <= stop) {
    if (!mask || mask.has(cur.getDay())) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export interface AttendanceAggregate {
  daysWorked: number;
  attainedHours: number;
  overtimeHours: number;
  lateHours: number;
  lateDays: number;
  leaveDays: number;
  leaveHours: number;
}

/**
 * Aggregate a worker's attendance rows for a period into the figures the
 * payroll calculator expects. A "day worked" is an attendance row that has
 * BOTH a check-in and a check-out recorded (status !== 'Absent'). Rows
 * missing either punch are excluded entirely — their hours, overtime and
 * lateness do not count toward payroll. Leave is not modelled yet, so
 * leaveDays/leaveHours are left at 0.
 */
export function aggregateAttendance(records: Attendance[]): AttendanceAggregate {
  let daysWorked = 0;
  let attainedHours = 0;
  let overtimeHours = 0;
  let lateHours = 0;
  let lateDays = 0;

  for (const r of records) {
    const complete = r.status !== 'Absent' && r.checkIn != null && r.checkOut != null;
    if (!complete) continue;
    daysWorked++;
    attainedHours += r.totalHours || 0;
    overtimeHours += r.overtimeHours || 0;
    lateHours += r.lateHours || 0;
    lateDays += r.lateDays || 0;
  }

  return {
    daysWorked,
    attainedHours,
    overtimeHours,
    lateHours,
    lateDays,
    leaveDays: 0,
    leaveHours: 0,
  };
}