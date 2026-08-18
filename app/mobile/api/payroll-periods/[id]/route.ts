import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PayrollCalculator, SalaryComponentData } from '@/lib/payroll-calculator';
import {
  mobileRequireContractorPermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';
import { shiftNetHours, countExpectedDays, aggregateAttendance } from '@/lib/attendance-utils';
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
      const workerWhere: any = {
        contractorId: period.contractorId,
        status: 'Active'
      };
      if (period.paymentFrequency && period.paymentFrequency !== 'all') {
        workerWhere.designation = {
          paymentFrequency: period.paymentFrequency
        };
      }
      workerCount = await prisma.worker.count({ where: workerWhere });
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

      if (period.paymentFrequency && period.paymentFrequency !== 'all') {
        workerWhere.designation = {
          paymentFrequency: period.paymentFrequency
        };
      }

      const workers = await prisma.worker.findMany({
        where: workerWhere,
        include: { designation: true, shift: true }
      });

      const components = await prisma.salaryComponent.findMany({
        where: { contractorId: period.contractorId, isActive: true }
      });

      await syncBiometricToDatabase(period.contractorId, period.startDate, period.endDate);

      const periodStart = startOfDay(period.startDate);
      const periodEnd = endOfDay(period.endDate);

      let totalGross = 0;
      let totalNet = 0;
      let totalDeductions = 0;

      for (const worker of workers) {
        if (!worker.designation) continue;

        const attendanceRecords = await prisma.attendance.findMany({
          where: {
            workerId: worker.id,
            date: { gte: periodStart, lte: periodEnd },
          },
        });

        const agg = aggregateAttendance(attendanceRecords);
        const hoursPerDay = shiftNetHours(worker.shift);
        const expectedDays = countExpectedDays(
          period.startDate,
          period.endDate,
          worker.shift?.workingDays,
        );
        const daysInPeriod = Math.max(
          1,
          Math.round((period.endDate.getTime() - period.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
        );
        const expectedHours = expectedDays * hoursPerDay;

        // In simple mode: pay salary * working days, ignore attendance,
        // overtime, late penalties, and hours.
        // In simple_overtime mode: pay salary * working days, but still
        // pay overtime from real attendance per shift config. Late ignored.
        const isSimple = mode !== 'full';
        const includeOvertime = mode === 'simple_overtime';
        const calc = PayrollCalculator.calculate({
          basicSalary: worker.designation.salary || 0,
          components: components as unknown as SalaryComponentData[],
          includePersonalRelief: true,
          attendance: isSimple
            ? {
                overtimeHours: includeOvertime ? agg.overtimeHours : 0,
                lateHours: 0,
                lateDays: 0,
                daysWorked: expectedDays,
                workingDays: expectedDays,
                attainedDays: expectedDays,
                workingHours: expectedHours,
                attainedHours: expectedHours,
                leaveDays: 0,
                leaveHours: 0,
              }
            : {
                overtimeHours: agg.overtimeHours,
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
            paymentFrequency: 'daily',
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
        });

        const slipDaysWorked = isSimple ? expectedDays : agg.daysWorked;
        const slipOvertimeHours = isSimple && !includeOvertime ? 0 : agg.overtimeHours;
        const slipLateDays = isSimple ? 0 : agg.lateDays;
        const slipLateHours = isSimple ? 0 : agg.lateHours;
        const slipAttainedHours = isSimple ? expectedHours : agg.attainedHours;

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
      }

      const updatedPeriod = await prisma.payrollPeriod.update({
        where: { id },
        data: {
          status: 'completed',
          totalEmployees: workers.length,
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
      paymentFrequency: body.paymentFrequency,
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
