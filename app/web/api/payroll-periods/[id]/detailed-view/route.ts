import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireContractorPermission } from '@/lib/require-permission';
import {
  shiftNetHours,
  countExpectedDays,
  bucketOvertimeForRecord,
  rulesByDayType,
  toDateKey,
} from '@/lib/attendance-utils';
import { startOfDay, endOfDay } from 'date-fns';

/** Round to the nearest 0.5 (per the proposed detailed-view format). */
function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

/**
 * Detailed view data for a processed payroll period (see
 * "PROPOSED DETAILED VIEW.xlsx"): per worker, a per-day matrix of
 * attendance (1 = present, 0 = absent) and overtime hours (rounded to the
 * nearest 0.5) extracted from the biometric attendance records, alongside
 * the payroll totals from the salary slip.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireContractorPermission(request, 'payroll:read');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const contractorId = permCheck.contractorId!;
    const { id } = await params;

    const period = await prisma.payrollPeriod.findFirst({
      where: { id, contractorId },
      include: {
        salarySlips: {
          include: {
            designation: true,
            worker: {
              include: {
                designation: { include: { overtimeRules: true } },
                shift: true,
              },
            },
          },
        },
      },
    });
    if (!period) {
      return NextResponse.json({ error: 'Payroll period not found' }, { status: 404 });
    }

    const periodStart = startOfDay(period.startDate);
    const periodEnd = endOfDay(period.endDate);

    // Calendar days of the period (local dates, inclusive).
    const days: { key: string; dayOfMonth: number; weekday: number }[] = [];
    for (let cur = startOfDay(periodStart); cur <= periodEnd; cur.setDate(cur.getDate() + 1)) {
      days.push({ key: toDateKey(cur), dayOfMonth: cur.getDate(), weekday: cur.getDay() });
    }

    const workerIds = period.salarySlips.map(s => s.workerId);
    const attendanceRows = workerIds.length > 0
      ? await prisma.attendance.findMany({
          where: { workerId: { in: workerIds }, date: { gte: periodStart, lte: periodEnd } },
        })
      : [];

    // Public holidays (±1 day for overnight engagements) — used by the
    // banded overtime recompute, same as the payroll run.
    const holidayFrom = new Date(periodStart);
    holidayFrom.setDate(holidayFrom.getDate() - 1);
    const holidayTo = new Date(periodEnd);
    holidayTo.setDate(holidayTo.getDate() + 1);
    const holidayRows = await prisma.holiday.findMany({
      where: { contractorId, date: { gte: holidayFrom, lte: holidayTo } },
    });
    const holidayDates = new Set(holidayRows.map(h => toDateKey(h.date)));

    const byWorker = new Map<string, Map<string, typeof attendanceRows[number]>>();
    for (const row of attendanceRows) {
      let dayMap = byWorker.get(row.workerId);
      if (!dayMap) {
        dayMap = new Map();
        byWorker.set(row.workerId, dayMap);
      }
      dayMap.set(toDateKey(row.date), row);
    }

    const daysInPeriod = Math.max(
      1,
      Math.round((period.endDate.getTime() - period.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    );

    const rows = period.salarySlips.map(slip => {
      const worker = slip.worker;
      const designation = slip.designation || worker.designation;
      const shift = worker.shift;
      const rules = rulesByDayType(worker.designation?.overtimeRules);

      const ctx = {
        workingDays: shift?.workingDays,
        holidayDates,
      };

      // Per-day matrix: 1 = present (complete punch pair), 0 = absent;
      // overtime recomputed per day type from the raw punches, rounded to
      // the nearest 0.5.
      const attendance: Record<string, { present: 0 | 1; overtimeHours: number }> = {};
      let presentDays = 0;
      let totalOvertimeHours = 0;
      const dayMap = byWorker.get(worker.id);
      for (const day of days) {
        const record = dayMap?.get(day.key);
        const complete = record != null && record.status !== 'Absent' && record.checkIn != null && record.checkOut != null;
        let overtimeHours = 0;
        if (complete && shift) {
          const bands = bucketOvertimeForRecord(
            new Date(record.checkIn!),
            new Date(record.checkOut!),
            shift,
            ctx,
            rules,
          );
          overtimeHours = roundToHalf(bands.weekday + bands.rest_day + bands.public_holiday);
        }
        if (complete) presentDays++;
        totalOvertimeHours += overtimeHours;
        attendance[day.key] = { present: complete ? 1 : 0, overtimeHours };
      }
      totalOvertimeHours = roundToHalf(totalOvertimeHours);

      // Headline overtime hourly rate (weekday rule → shift config → 1x),
      // derived the same way the payroll calculator derives its rates.
      const salary = designation?.salary || 0;
      const hoursPerDay = shiftNetHours(shift) || 8;
      const expectedDays = countExpectedDays(period.startDate, period.endDate, shift?.workingDays) || daysInPeriod;
      const frequency = (designation?.paymentFrequency || 'monthly').toLowerCase();
      let dailyRate: number;
      if (frequency === 'daily') {
        dailyRate = salary;
      } else if (frequency === 'weekly') {
        dailyRate = salary / (expectedDays || 7);
      } else {
        dailyRate = expectedDays > 0 ? salary / expectedDays : salary / daysInPeriod;
      }
      const hourlyRate = hoursPerDay > 0 ? dailyRate / hoursPerDay : dailyRate / 8;

      const weekdayRule = rules.weekday;
      let overtimeRatePerHour: number;
      if (weekdayRule) {
        overtimeRatePerHour = weekdayRule.rateType === 'fixed'
          ? weekdayRule.rateAmount
          : weekdayRule.rateAmount * hourlyRate;
      } else if (shift) {
        if (shift.overtimeRateType === 'fixed' && shift.overtimeRateAmount > 0) {
          overtimeRatePerHour = shift.overtimeRateAmount;
        } else {
          overtimeRatePerHour = (shift.overtimeRateAmount > 0 ? shift.overtimeRateAmount : 1) * hourlyRate;
        }
      } else {
        overtimeRatePerHour = hourlyRate;
      }
      overtimeRatePerHour = Math.round(overtimeRatePerHour * 100) / 100;

      return {
        workerId: worker.id,
        workerName: worker.name,
        designation: designation?.title || 'Worker',
        salary,
        overtimeRatePerHour,
        attendance,
        totalOvertimeHours,
        daysWorked: presentDays,
        grossSalary: slip.basicSalary,
        grossOt: slip.overtimePay,
        grossSalaryPlusOt: slip.basicSalary + slip.overtimePay,
        payeTax: slip.payeTax,
        netPay: slip.netPay,
        status: slip.paymentStatus,
      };
    });

    return NextResponse.json({
      period: {
        name: period.name,
        startDate: period.startDate,
        endDate: period.endDate,
      },
      days,
      rows,
    });
  } catch (error) {
    console.error('Failed to build detailed view:', error);
    return NextResponse.json({ error: 'Failed to build detailed view' }, { status: 500 });
  }
}
