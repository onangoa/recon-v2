import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PayrollCalculator, SalaryComponentData } from '@/lib/payroll-calculator';
import { requireContractorPermission } from '@/lib/require-permission';
import { shiftNetHours, countExpectedDays, aggregateAttendance, computeWorkedHours } from '@/lib/attendance-utils';
import { syncBiometricToDatabase } from '@/lib/biometric-attendance';
import { startOfDay, endOfDay } from 'date-fns';

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
      return NextResponse.json({ error: 'Payroll period not found' }, { status: 404 });
    }

    // Ensure accurate worker count
    let workerCount = period.totalEmployees;
    if (period.status === 'draft') {
      workerCount = await prisma.worker.count({ 
        where: { contractorId: period.contractorId, status: 'Active' } 
      });
    } else if (period.salarySlips.length > 0) {
      workerCount = period.salarySlips.length;
    }

    return NextResponse.json({
      ...period,
      totalEmployees: workerCount
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payroll period' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireContractorPermission(request, 'payroll:update');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, payrollMode, simpleMode, ...otherData } = body;

    // Normalize mode: accept new payrollMode string or legacy simpleMode boolean
    const mode: 'full' | 'simple' | 'simple_overtime' =
      payrollMode || (simpleMode ? 'simple' : 'full');

    // Check if we are starting processing
    if (status === 'processing') {
      // 1. Fetch the period and contractor info
      const period = await prisma.payrollPeriod.findFirst({
        where: { id, contractorId },
        include: { contractor: true }
      });

      if (!period) return NextResponse.json({ error: 'Period not found' }, { status: 404 });

      // 2. Fetch all active workers for this contractor
      const workerWhere: any = { 
        contractorId: period.contractorId, 
        status: 'Active' 
      };

      const workers = await prisma.worker.findMany({
        where: workerWhere,
        include: { designation: true, shift: true }
      });

      // 3. Fetch active salary components
      const components = await prisma.salaryComponent.findMany({
        where: { contractorId: period.contractorId, isActive: true }
      });

      // 3a. Sync biometric attendance records to the database so the
      // payroll query below can find them. The attendance page reads
      // live from the biometric device API, but payroll reads from the
      // DB — without this sync the DB can be empty even though the
      // attendance page shows data.
      await syncBiometricToDatabase(period.contractorId, period.startDate, period.endDate);

      // Normalise period dates to local start/end of day to avoid
      // timezone edge cases where attendance stored at local midnight
      // falls outside a period boundary stored at UTC midnight.
      const periodStart = startOfDay(period.startDate);
      const periodEnd = endOfDay(period.endDate);

      let totalGross = 0;
      let totalNet = 0;
      let totalDeductions = 0;
      let slipCount = 0;

      // Delete existing slips so re-processing starts clean — workers who
      // now have 0 days won't keep stale slips from a previous run.
      await prisma.salarySlip.deleteMany({ where: { payrollPeriodId: id } });

      // 4. Generate Slips in a transaction (simulated or actual)
      for (const worker of workers) {
        if (!worker.designation) continue;

        // Pull attendance for this worker across the period and aggregate it
        // into the figures the calculator needs.
        const attendanceRecords = await prisma.attendance.findMany({
          where: {
            workerId: worker.id,
            date: { gte: periodStart, lte: periodEnd },
          },
        });

        // Re-compute hours on the fly so stale DB values (from an old
        // formula or a failed biometric sync) don't corrupt the payroll.
        const recomputedRecords = attendanceRecords.map((a) => {
          if (a.checkIn && a.checkOut && worker.shift) {
            const w = computeWorkedHours(
              new Date(a.checkIn),
              new Date(a.checkOut),
              worker.shift as any,
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

        const agg = aggregateAttendance(recomputedRecords as any);

        // Skip workers with no attendance — they shouldn't receive payslips.
        if (agg.daysWorked === 0) continue;

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
        });

        // Upsert Salary Slip (prevent duplicates for same period/worker)
        const slipDaysWorked = agg.daysWorked;
        const slipOvertimeHours = isSimple && !includeOvertime ? 0 : agg.overtimeHours;
        const slipLateDays = isSimple ? 0 : agg.lateDays;
        const slipLateHours = isSimple ? 0 : agg.lateHours;
        const slipAttainedHours = agg.attainedHours;

        await prisma.salarySlip.upsert({
          where: {
            // We need a unique constraint in schema for this to work perfectly,
            // but for now we'll delete existing and create new
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
        slipCount++;
      }

      // 5. Update period with totals and set status to completed (auto-transition for now)
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

      return NextResponse.json(updatedPeriod);
    }

    // Default update behavior
    const updateData: any = {
      name: body.name,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      status: status,
      description: body.description,
    };

    // Only update totals if they are explicitly provided (usually from a processing run)
    if (body.totalEmployees !== undefined) updateData.totalEmployees = body.totalEmployees;
    if (body.totalGrossPay !== undefined) updateData.totalGrossPay = body.totalGrossPay;
    if (body.totalNetPay !== undefined) updateData.totalNetPay = body.totalNetPay;
    if (body.totalDeductions !== undefined) updateData.totalDeductions = body.totalDeductions;

    const updatedPeriod = await prisma.payrollPeriod.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(updatedPeriod);
  } catch (error) {
    console.error('Failed to update payroll period:', error);
    return NextResponse.json({ error: 'Failed to update payroll period' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireContractorPermission(request, 'payroll:delete');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const existing = await prisma.payrollPeriod.findFirst({
      where: { id, contractorId },
      select: { id: true }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Payroll period not found' }, { status: 404 });
    }
    // Check if it has salary slips
    const slipCount = await prisma.salarySlip.count({
      where: { payrollPeriodId: id },
    });
    if (slipCount > 0) {
      return NextResponse.json({ error: 'Cannot delete period with salary slips' }, { status: 400 });
    }
    await prisma.payrollPeriod.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Payroll period deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete payroll period' }, { status: 500 });
  }
}
