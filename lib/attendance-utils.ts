import { differenceInMinutes } from 'date-fns';

export interface ShiftShape {
  startTime: string;   // "HH:mm"
  endTime: string;     // "HH:mm"
  breakDuration: number; // minutes
  allowOvertime: boolean;
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
 *  - `totalHours` = (checkOut - checkIn) in hours (breaks already absorbed
 *    because the worker was off the clock; only the *outer* session is used).
 *  - `expectedHours` = (shift end - shift start, overnight-wrapped) - break.
 *  - `overtimeHours` = max(0, totalHours - expectedHours) when shift.allowOvertime.
 *  - `lateMinutes` = minutes checkIn occurs after shift start (0 if on time,
 *    or if no shift / no checkIn).
 */
export function computeWorkedHours(
  checkIn: Date,
  checkOut: Date,
  shift: ShiftShape | null | undefined,
): WorkedHours {
  const totalMinutes = Math.max(0, differenceInMinutes(checkOut, checkIn));
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

  const overtimeHours =
    shift.allowOvertime && totalHours > expectedHours
      ? totalHours - expectedHours
      : 0;

  // Lateness: compare the check-in time-of-day to the shift start.
  const checkInMinutes = checkIn.getHours() * 60 + checkIn.getMinutes();
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