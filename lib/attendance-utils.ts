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
  const overtimeStart = shiftOvertimeStart(ci, shift);

  let overtimeHours = 0;
  if (overtimeStart && co > overtimeStart) {
    overtimeHours = (co.getTime() - overtimeStart.getTime()) / (1000 * 60 * 60);
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

/**
 * The DateTime at which overtime starts for a check-in under the legacy
 * (non-banded) rules: the shift's scheduled end on the check-in calendar
 * day plus the threshold grace minutes. Null when the shift does not
 * allow overtime or has zero length.
 */
function shiftOvertimeStart(checkIn: Date, shift: ShiftShape): Date | null {
  if (!shift.allowOvertime) return null;

  const start = parseHHMM(shift.startTime);
  const end = parseHHMM(shift.endTime);
  let shiftMinutes = end - start;
  if (shiftMinutes < 0) shiftMinutes += 24 * 60; // overnight wrap
  if (shiftMinutes <= 0) return null;

  // Anchor shift start to the check-in calendar day at midnight, then
  // offset by the shift start minutes-from-midnight.
  const midnight = new Date(checkIn);
  midnight.setHours(0, 0, 0, 0);

  const shiftEnd = new Date(midnight.getTime() + (start + shiftMinutes) * 60 * 1000);
  return new Date(shiftEnd.getTime() + (shift.overtimeThresholdMinutes || 0) * 60 * 1000);
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

// ---------------------------------------------------------------------------
// Per-designation day-type overtime (Option #3 in overtime.md)
// ---------------------------------------------------------------------------

/** The day types an overtime rule can be attached to. */
export type OvertimeDayType = 'weekday' | 'rest_day' | 'public_holiday';

export const OVERTIME_DAY_TYPES: readonly OvertimeDayType[] = [
  'weekday',
  'rest_day',
  'public_holiday',
];

/** Shape shared by the Prisma `OvertimeRule` and the designation form. */
export interface OvertimeRuleShape {
  dayType: string;
  /** "hourly" (rateAmount = multiplier) or "fixed" (rateAmount = KES/hour). */
  rateType: string;
  rateAmount: number;
  capHoursPerDay?: number | null;
  isActive?: boolean;
}

/** Overtime hours split per day type. */
export interface OvertimeBandHours {
  weekday: number;
  rest_day: number;
  public_holiday: number;
}

export function emptyOvertimeBands(): OvertimeBandHours {
  return { weekday: 0, rest_day: 0, public_holiday: 0 };
}

/** Local-calendar date key ("yyyy-mm-dd") used to match holiday dates. */
export function toDateKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/** Context needed to classify a calendar day into an overtime day type. */
export interface DayTypeContext {
  /** Free-form working days from the worker's shift ("Mon,Tue,..."). Null/empty = every day is a working day (Sunday is then the rest day). */
  workingDays?: string | null;
  /** Local "yyyy-mm-dd" keys of the contractor's public holiday dates. */
  holidayDates: Set<string>;
}

/**
 * Classify a calendar day into an overtime day type.
 *  - public holiday when the date is in the holiday set
 *  - rest day when the day is outside the shift's working days
 *    (or is a Sunday when no working days are configured)
 *  - weekday otherwise
 */
export function resolveDayType(date: Date, ctx: DayTypeContext): OvertimeDayType {
  if (ctx.holidayDates.has(toDateKey(date))) return 'public_holiday';
  const mask = parseWorkingDays(ctx.workingDays);
  if (mask ? !mask.has(date.getDay()) : date.getDay() === 0) return 'rest_day';
  return 'weekday';
}

function isDayType(value: string): value is OvertimeDayType {
  return (OVERTIME_DAY_TYPES as readonly string[]).includes(value);
}

/** A validated overtime rule row ready to persist against a designation. */
export interface NormalizedOvertimeRule {
  dayType: OvertimeDayType;
  rateType: string;
  rateAmount: number;
  capHoursPerDay: number | null;
  isActive: boolean;
}

/**
 * Validate/normalise an `overtimeRules` payload from the designation API:
 * drops unknown day types and duplicates, clamps amounts, defaults the
 * rate type to "hourly" and isActive to true.
 */
export function normalizeOvertimeRules(rules: unknown): NormalizedOvertimeRule[] {
  if (!Array.isArray(rules)) return [];
  const out: NormalizedOvertimeRule[] = [];
  const seen = new Set<string>();
  for (const raw of rules) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    const dayType = String(r.dayType ?? '');
    if (!isDayType(dayType) || seen.has(dayType)) continue;
    seen.add(dayType);

    const rateType = r.rateType === 'fixed' ? 'fixed' : 'hourly';
    const rateAmountNum = Number(r.rateAmount);
    const rateAmount = Number.isFinite(rateAmountNum) ? Math.max(0, rateAmountNum) : 0;
    const capNum = r.capHoursPerDay == null || r.capHoursPerDay === '' ? NaN : Number(r.capHoursPerDay);
    const capHoursPerDay = Number.isFinite(capNum) && capNum >= 0 ? capNum : null;

    out.push({
      dayType,
      rateType,
      rateAmount,
      capHoursPerDay,
      isActive: r.isActive !== false,
    });
  }
  return out;
}

/** Index rules by day type; inactive / unknown-day-type rules are dropped. */
export function rulesByDayType(
  rules: OvertimeRuleShape[] | null | undefined,
): Partial<Record<OvertimeDayType, OvertimeRuleShape>> {
  const map: Partial<Record<OvertimeDayType, OvertimeRuleShape>> = {};
  for (const rule of rules || []) {
    if (rule.isActive === false) continue;
    if (!isDayType(rule.dayType)) continue;
    // First (or only, given the unique constraint) active rule wins.
    if (!map[rule.dayType]) map[rule.dayType] = rule;
  }
  return map;
}

/**
 * Bucket a single check-in/check-out pair's overtime into day-type bands.
 *
 * Policy (see overtime.md "Lean plan for #3"):
 *  - No shift, or a shift with allowOvertime = false → no overtime at all
 *    (legacy behaviour preserved).
 *  - Rest day / public holiday engagement, when the designation has an
 *    active rule for that day type: ALL worked hours that day count as
 *    overtime in that band (statutory practice — work on a rest day or
 *    holiday is overtime in full, not just hours past a shift end).
 *  - Otherwise (weekdays, or rest/holiday days without a matching
 *    designation rule): the legacy window — hours past the shift's end
 *    time plus its threshold grace.
 *  - The overtime window is split at local midnight and each piece is
 *    banded by the calendar day it falls on, so overnight overtime
 *    bleeding into a Sunday lands in the rest-day band.
 *  - A band with a capHoursPerDay rule is capped per attendance record.
 */
export function bucketOvertimeForRecord(
  checkIn: Date,
  checkOut: Date,
  shift: ShiftShape | null | undefined,
  ctx: DayTypeContext,
  rules: Partial<Record<OvertimeDayType, OvertimeRuleShape>> = {},
): OvertimeBandHours {
  const bands = emptyOvertimeBands();
  if (!shift || !shift.allowOvertime) return bands;

  const ci = new Date(checkIn);
  ci.setSeconds(0, 0);
  const co = new Date(checkOut);
  co.setSeconds(0, 0);

  const recordDayType = resolveDayType(ci, ctx);
  const engagementRule = rules[recordDayType];

  let windowStart: Date | null;
  if (recordDayType !== 'weekday' && engagementRule) {
    // Rest-day / public-holiday engagement: everything worked is overtime.
    windowStart = ci;
  } else {
    // Legacy window: past shift end + threshold on the check-in day.
    const otStart = shiftOvertimeStart(ci, shift);
    windowStart = otStart && co > otStart ? otStart : null;
  }
  if (!windowStart || co <= windowStart) return bands;

  // Split the overtime window at local midnight; each piece is banded by
  // the calendar day it falls on.
  let cursor = new Date(windowStart);
  while (cursor < co) {
    const nextMidnight = new Date(cursor);
    nextMidnight.setHours(0, 0, 0, 0);
    nextMidnight.setDate(nextMidnight.getDate() + 1);
    const chunkEnd = nextMidnight < co ? nextMidnight : co;
    const hours = (chunkEnd.getTime() - cursor.getTime()) / (1000 * 60 * 60);
    if (hours > 0) {
      const dayType = resolveDayType(cursor, ctx);
      bands[dayType] += hours;
    }
    cursor = chunkEnd;
  }

  // Apply per-band caps (per attendance record / engagement day).
  for (const dayType of OVERTIME_DAY_TYPES) {
    const cap = rules[dayType]?.capHoursPerDay;
    if (cap != null && cap >= 0 && bands[dayType] > cap) {
      bands[dayType] = cap;
    }
  }

  return bands;
}

export interface AttendanceBandsAggregate extends AttendanceAggregate {
  /** Overtime hours per day type; `overtimeHours` is their sum. */
  overtimeBands: OvertimeBandHours;
}

/**
 * Banded variant of `aggregateAttendance`: classifies each complete
 * attendance row's overtime into weekday / rest-day / holiday bands at
 * payroll recompute time. The biometric write path keeps using the
 * single-number `computeWorkedHours` / `aggregateAttendance` pipeline.
 */
export function aggregateAttendanceWithBands(
  records: Attendance[],
  options: {
    shift?: ShiftShape | null | undefined;
    workingDays?: string | null;
    holidayDates?: Set<string>;
    rules?: OvertimeRuleShape[] | null;
  } = {},
): AttendanceBandsAggregate {
  const ctx: DayTypeContext = {
    workingDays: options.workingDays !== undefined ? options.workingDays : options.shift?.workingDays,
    holidayDates: options.holidayDates || new Set<string>(),
  };
  const rules = rulesByDayType(options.rules);

  let daysWorked = 0;
  let attainedHours = 0;
  let lateHours = 0;
  let lateDays = 0;
  const overtimeBands = emptyOvertimeBands();

  for (const r of records) {
    const complete = r.status !== 'Absent' && r.checkIn != null && r.checkOut != null;
    if (!complete) continue;
    daysWorked++;
    attainedHours += r.totalHours || 0;
    lateHours += r.lateHours || 0;
    lateDays += r.lateDays || 0;

    if (options.shift) {
      const bands = bucketOvertimeForRecord(
        new Date(r.checkIn!),
        new Date(r.checkOut!),
        options.shift,
        ctx,
        rules,
      );
      overtimeBands.weekday += bands.weekday;
      overtimeBands.rest_day += bands.rest_day;
      overtimeBands.public_holiday += bands.public_holiday;
    }
  }

  const overtimeHours =
    overtimeBands.weekday + overtimeBands.rest_day + overtimeBands.public_holiday;

  return {
    daysWorked,
    attainedHours,
    overtimeHours,
    overtimeBands,
    lateHours,
    lateDays,
    leaveDays: 0,
    leaveHours: 0,
  };
}