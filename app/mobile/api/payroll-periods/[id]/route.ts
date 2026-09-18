import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PayrollCalculator, SalaryComponentData, OvertimeRuleInput } from '@/lib/payroll-calculator';
import {
  mobileRequireContractorPermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';
import {
  shiftNetHours,
  countExpectedDays,
  aggregateAttendanceWithBands,
  computeWorkedHours,
  expectedDaysAndHoursForShifts,
  resolveShiftForDate,
  toDateKey,
} from '@/lib/attendance-utils';
import { collectShifts } from '@/lib/worker-shifts';
import { syncBiometricToDatabase } from '@/lib/biometric-attendance';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'payroll:read');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const contractorId = permCheck.contractorId!;
    const { id } = await params;
    const period = await prisma.payrollPeriod.findFirst({
      where: { id, contractorId },
      include: {
        createdBy: true,
        salarySlips: {
          include: {
            worker: true,
            designation: true,
            details: true,
          }
        },
      },
    });
    if (!period) {
      return mobileError('Payroll period not found', 404);
    }

    let workerCount = period.totalEmployees;
    if (period.status === 'draft') {
      workerCount = await prisma.worker.count({
        where: { contractorId: period.contractorId, status: 'Active' }
      });
    } else if (period.salarySlips.length > 0) {
      workerCount = period.salarySlips.length;
    }

    return mobileSuccess({
      ...period,
      totalEmployees: workerCount
    });
  } catch (error) {
    return mobileError('Failed to fetch payroll period', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'payroll:update');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, payrollMode, simpleMode, ...otherData } = body;

    // Normalize mode: accept new payrollMode string or legacy simpleMode boolean
    const mode: 'full' | 'simple' | 'simple_overtime' =
      payrollMode || (simpleMode ? 'simple' : 'full');

    if (status === 'processing') {
      const period = await prisma.payrollPeriod.findFirst({
        where: { id, contractorId },
        include: { contractor: true }
      });

      if (!period) return mobileError('Period not found', 404);

      const workerWhere: any = {
        contractorId: period.contractorId,
        status: 'Active'
      };

      const workers = await prisma.worker.findMany({
        where: workerWhere,
        include: {
          designation: { include: { overtimeRules: true } },
          shift: true,
          workerShifts: { include: { shift: true } },
        }
      });

      const components = await prisma.salaryComponent.findMany({
        where: { contractorId: period.contractorId, isActive: true }
      });

      await syncBiometricToDatabase(period.contractorId, period.startDate, period.endDate);

      const periodStart = startOfDay(period.startDate);
      const periodEnd = endOfDay(period.endDate);

      // Public holidays for the period (±1 day to cover overnight
      // engagements that spill past the period boundary) — used to bucket
      // each worker's overtime into weekday / rest-day / holiday bands.
      const holidayFrom = new Date(periodStart);
      holidayFrom.setDate(holidayFrom.getDate() - 1);
      const holidayTo = new Date(periodEnd);
      holidayTo.setDate(holidayTo.getDate() + 1);
      const holidayRows = await prisma.holiday.findMany({
        where: { contractorId: period.contractorId, date: { gte: holidayFrom, lte: holidayTo } },
      });
      const holidayDates = new Set(holidayRows.map(h => toDateKey(h.date)));

      let totalGross = 0;
      let totalNet = 0;
      let totalDeductions = 0;
      let slipCount = 0;

      // Delete existing slips so re-processing starts clean — workers who
      // now have 0 days won't keep stale slips from a previous run.
      await prisma.salarySlip.deleteMany({ where: { payrollPeriodId: id } });

      for (const worker of workers) {
        if (!worker.designation) continue;

        // All shifts the worker holds; the one whose workingDays include a
        // record's date drives that day's hours/overtime.
        const allShifts = collectShifts(worker);
        const shiftForRecord = (date: Date) =>
          allShifts.length <= 1
            ? (worker.shift as any)
            : resolveShiftForDate(allShifts, date, worker.shiftId);

        const attendanceRecords = await prisma.attendance.findMany({
          where: {
            workerId: worker.id,
            date: { gte: periodStart, lte: periodEnd },
          },
        });

        // Re-compute hours on the fly so stale DB values (from an old
        // formula or a failed biometric sync) don't corrupt the payroll.
        // Overtime itself is re-derived per day type from the raw punches
        // in aggregateAttendanceWithBands below.
        const recomputedRecords = attendanceRecords.map((a) => {
          const dayShift = shiftForRecord(new Date(a.date));
          if (a.checkIn && a.checkOut && dayShift) {
            const w = computeWorkedHours(
              new Date(a.checkIn),
              new Date(a.checkOut),
              dayShift,
            );
            return {
              ...a,
              totalHours: w.totalHours,
              overtimeHours: w.overtimeHours,
              lateHours: w.lateHours,
              lateDays: w.lateDays,
            };
          }
          return a;
        });

        // Bucket overtime into weekday / rest-day / public-holiday bands
        // using the designation's per-day-type rules (caps included).
        const agg = aggregateAttendanceWithBands(recomputedRecords as any, {
          shift: worker.shift as any,
          shifts: allShifts as any,
          resolveShift: (r) => shiftForRecord(new Date(r.date)),
          holidayDates,
          rules: worker.designation.overtimeRules,
        });

        // Skip workers with no complete attendance (log in + log out) —
        // they shouldn't receive payslips.
        if (agg.daysWorked === 0) continue;

        const overtimeRuleInputs: OvertimeRuleInput[] = worker.designation.overtimeRules.map(r => ({
          dayType: r.dayType as OvertimeRuleInput['dayType'],
          rateType: r.rateType,
          rateAmount: r.rateAmount,
          isActive: r.isActive,
        }));

        // Expected days/hours: with several shifts each expected day
        // contributes its own shift's net hours; single-shift workers keep
        // the legacy countExpectedDays x shiftNetHours behaviour.
        let hoursPerDay = shiftNetHours(worker.shift);
        let expectedDays = countExpectedDays(
          period.startDate,
          period.endDate,
          worker.shift?.workingDays,
        );
        if (allShifts.length > 1) {
          const expected = expectedDaysAndHoursForShifts(allShifts, period.startDate, period.endDate);
          expectedDays = expected.days;
          hoursPerDay = expected.days > 0 ? expected.hours / expected.days : 0;
        }
        const daysInPeriod = Math.max(
          1,
          Math.round((period.endDate.getTime() - period.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
        );
        const expectedHours = expectedDays * hoursPerDay;

        // All three modes pro-rate basic pay by actual days worked.
        //  - simple:            daily rate × days worked, no OT, no late.
        //  - simple_overtime:   daily rate × days worked + OT per shift, no late.
        //  - full:              daily rate × days worked + OT per shift − late.
        const isSimple = mode !== 'full';
        const includeOvertime = mode === 'simple_overtime';
        const calc = PayrollCalculator.calculate({
          basicSalary: worker.designation.salary || 0,
          components: components as unknown as SalaryComponentData[],
          includePersonalRelief: true,
          attendance: isSimple
            ? {
                overtimeHours: includeOvertime ? agg.overtimeHours : 0,
                overtimeBands: includeOvertime ? agg.overtimeBands : undefined,
                lateHours: 0,
                lateDays: 0,
                daysWorked: agg.daysWorked,
                workingDays: expectedDays,
                attainedDays: agg.daysWorked,
                workingHours: expectedHours,
                attainedHours: agg.attainedHours,
                leaveDays: 0,
                leaveHours: 0,
              }
            : {
                overtimeHours: agg.overtimeHours,
                overtimeBands: agg.overtimeBands,
                lateHours: agg.lateHours,
                lateDays: agg.lateDays,
                daysWorked: agg.daysWorked,
                workingDays: expectedDays,
                attainedDays: agg.daysWorked,
                workingHours: expectedHours,
                attainedHours: agg.attainedHours,
                leaveDays: agg.leaveDays,
                leaveHours: agg.leaveHours,
              },
          rate: {
            paymentFrequency: worker.designation.paymentFrequency || 'monthly',
            hoursPerDay,
            daysInPeriod,
            expectedDaysInPeriod: expectedDays,
          },
          overtimeConfig: worker.shift
            ? {
                rateType: worker.shift.overtimeRateType,
                rateAmount: worker.shift.overtimeRateAmount,
              }
            : undefined,
          // Per-designation day-type rules; each band falls back to the
          // shift config above, then the 1x default.
          overtimeRules: overtimeRuleInputs,
        });

        const slipDaysWorked = agg.daysWorked;
        const slipOvertimeHours = isSimple && !includeOvertime ? 0 : agg.overtimeHours;
        const slipOvertimeBands = calc.overtimeBands.length > 0 ? JSON.stringify(calc.overtimeBands) : null;
        const slipLateDays = isSimple ? 0 : agg.lateDays;
        const slipLateHours = isSimple ? 0 : agg.lateHours;
        const slipAttainedHours = agg.attainedHours;

        await prisma.salarySlip.upsert({
          where: {
            id: (await prisma.salarySlip.findFirst({
              where: { payrollPeriodId: id, workerId: worker.id }
            }))?.id || 'new-id'
          },
          update: {
            basicSalary: calc.payableBasic,
            overtimeHours: slipOvertimeHours,
            overtimePay: calc.overtimePay,
            overtimeBands: slipOvertimeBands,
            daysWorked: slipDaysWorked,
            workingDays: expectedDays,
            attainedDays: slipDaysWorked,
            workingHours: expectedHours,
            attainedHours: slipAttainedHours,
            lateDays: slipLateDays,
            lateHours: slipLateHours,
            leaveDays: agg.leaveDays,
            leaveHours: agg.leaveHours,
            totalAllowance: calc.totalAllowance,
            totalDeductions: calc.totalDeductions,
            grossPay: calc.grossPay,
            chargeableIncome: calc.chargeableIncome,
            payeTax: calc.payeTax,
            personalRelief: calc.personalRelief,
            netPay: calc.netPay,
            status: 'processed',
            details: {
              deleteMany: {},
              create: calc.componentDetails.map(d => ({
                name: d.componentName,
                type: d.componentType,
                amount: d.amount || 0,
                isStatutory: d.isStatutory,
              }))
            }
          },
          create: {
            contractorId: period.contractorId,
            payrollPeriodId: id,
            workerId: worker.id,
            designationId: worker.designationId,
            basicSalary: calc.payableBasic,
            overtimeHours: slipOvertimeHours,
            overtimePay: calc.overtimePay,
            overtimeBands: slipOvertimeBands,
            daysWorked: slipDaysWorked,
            workingDays: expectedDays,
            attainedDays: slipDaysWorked,
            workingHours: expectedHours,
            attainedHours: slipAttainedHours,
            lateDays: slipLateDays,
            lateHours: slipLateHours,
            leaveDays: agg.leaveDays,
            leaveHours: agg.leaveHours,
            totalAllowance: calc.totalAllowance,
            totalDeductions: calc.totalDeductions,
            grossPay: calc.grossPay,
            chargeableIncome: calc.chargeableIncome,
            payeTax: calc.payeTax,
            personalRelief: calc.personalRelief,
            netPay: calc.netPay,
            status: 'processed',
            details: {
              create: calc.componentDetails.map(d => ({
                name: d.componentName,
                type: d.componentType,
                amount: d.amount || 0,
                isStatutory: d.isStatutory,
              }))
            }
          }
        });

        totalGross += calc.grossPay;
        totalNet += calc.netPay;
        totalDeductions += calc.totalDeductions;
        slipCount++;
      }

      const updatedPeriod = await prisma.payrollPeriod.update({
        where: { id },
        data: {
          status: 'completed',
          totalEmployees: slipCount,
          totalGrossPay: totalGross,
          totalNetPay: totalNet,
          totalDeductions: totalDeductions,
        },
      });

      return mobileSuccess(updatedPeriod, 'Payroll processed');
    }

    const updateData: any = {
      name: body.name,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      status: status,
      description: body.description,
    };

    if (body.totalEmployees !== undefined) updateData.totalEmployees = body.totalEmployees;
    if (body.totalGrossPay !== undefined) updateData.totalGrossPay = body.totalGrossPay;
    if (body.totalNetPay !== undefined) updateData.totalNetPay = body.totalNetPay;
    if (body.totalDeductions !== undefined) updateData.totalDeductions = body.totalDeductions;

    const updatedPeriod = await prisma.payrollPeriod.update({
      where: { id },
      data: updateData,
    });
    return mobileSuccess(updatedPeriod, 'Payroll period updated');
  } catch (error) {
    console.error('Mobile update payroll period error:', error);
    return mobileError('Failed to update payroll period', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'payroll:delete');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const existing = await prisma.payrollPeriod.findFirst({
      where: { id, contractorId },
      select: { id: true }
    });
    if (!existing) {
      return mobileError('Payroll period not found', 404);
    }
    const slipCount = await prisma.salarySlip.count({
      where: { payrollPeriodId: id },
    });
    if (slipCount > 0) {
      return mobileError('Cannot delete period with salary slips', 400);
    }
    await prisma.payrollPeriod.delete({
      where: { id },
    });
    return mobileSuccess(null, 'Payroll period deleted');
  } catch (error) {
    return mobileError('Failed to delete payroll period', 500);
  }
}
