import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PayrollCalculator, SalaryComponentData, AttendancePayrollInput, RateConfig } from '@/lib/payroll-calculator';
import { shiftNetHours, countExpectedDays } from '@/lib/attendance-utils';
import { requireContractorPermission } from '@/lib/require-permission';

export async function GET(request: NextRequest) {
  const permCheck = await requireContractorPermission(request, 'salary_slips:read');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const contractorId = permCheck.contractorId!;
    const { searchParams } = new URL(request.url);
    const payrollPeriodId = searchParams.get('payrollPeriodId');
    const workerId = searchParams.get('workerId');

    const slips = await prisma.salarySlip.findMany({
      where: {
        contractorId,
        ...(payrollPeriodId ? { payrollPeriodId } : {}),
        ...(workerId ? { workerId } : {}),
      },
      include: {
        worker: true,
        designation: true,
        details: true,
      },
    });
    return NextResponse.json(slips);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch salary slips' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const permCheck = await requireContractorPermission(request, 'salary_slips:create');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const body = await request.json();
    const contractorId = permCheck.contractorId!;
    const {
      workerId,
      payrollPeriodId,
      designationId,
      workingHours,
      attainedHours,
      workingDays,
      attainedDays,
      overtimeHours,
      lateHours,
      lateDays,
      leaveHours,
      leaveDays,
      note,
      paymentMethod,
      phoneNumber
    } = body;

    // Fetch worker and designation
    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      include: { designation: true, shift: true }
    });

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    if (worker.contractorId !== contractorId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const designation = designationId 
      ? await prisma.designation.findUnique({ where: { id: designationId } })
      : worker.designation;

    if (!designation) {
      return NextResponse.json({ error: 'Designation not found' }, { status: 404 });
    }

    // Fetch active salary components for the contractor
    const components = await prisma.salaryComponent.findMany({
      where: { contractorId, isActive: true }
    });

    // Build attendance + rate inputs. When the caller supplies attendance
    // figures (and a payroll period exists for expected days/hours), the
    // calculator pro-rates basic pay, pays overtime at 1x and docks late
    // hours. Otherwise it falls back to legacy full-salary behaviour.
    let attendanceInput: AttendancePayrollInput | undefined;
    let rateInput: RateConfig | undefined;

    const attendanceProvided =
      workingHours != null || attainedHours != null ||
      workingDays != null || attainedDays != null ||
      overtimeHours != null || lateHours != null;

    if (attendanceProvided) {
      const period = payrollPeriodId
        ? await prisma.payrollPeriod.findFirst({ where: { id: payrollPeriodId, contractorId } })
        : null;

      const hoursPerDay = shiftNetHours(worker.shift);
      const startDate = period?.startDate;
      const endDate = period?.endDate;
      const expectedDays = startDate && endDate
        ? countExpectedDays(startDate, endDate, worker.shift?.workingDays)
        : (workingDays || 0);
      const daysInPeriod = startDate && endDate
        ? Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
        : expectedDays;
      const expectedHours = expectedDays * hoursPerDay;

      attendanceInput = {
        overtimeHours: overtimeHours || 0,
        lateHours: lateHours || 0,
        lateDays: lateDays || 0,
        daysWorked: attainedDays || 0,
        workingDays: workingDays || expectedDays,
        attainedDays: attainedDays || 0,
        workingHours: workingHours || expectedHours,
        attainedHours: attainedHours || 0,
        leaveDays: leaveDays || 0,
        leaveHours: leaveHours || 0,
      };
      rateInput = {
        paymentFrequency: period?.paymentFrequency || 'monthly',
        hoursPerDay,
        daysInPeriod,
        expectedDaysInPeriod: expectedDays,
      };
    }

    // Calculate payroll
    const calculation = PayrollCalculator.calculate({
      basicSalary: designation.salary || 0,
      components: components as unknown as SalaryComponentData[],
      includePersonalRelief: true,
      attendance: attendanceInput,
      rate: rateInput,
      overtimeConfig: worker.shift
        ? {
            rateType: worker.shift.overtimeRateType,
            rateAmount: worker.shift.overtimeRateAmount,
          }
        : undefined,
    });

    // Create salary slip
    const slip = await prisma.salarySlip.create({
      data: {
        contractorId,
        payrollPeriodId,
        workerId,
        designationId: designation.id,
        workingHours: attendanceInput?.workingHours ?? 0,
        attainedHours: attendanceInput?.attainedHours ?? 0,
        workingDays: attendanceInput?.workingDays ?? 0,
        attainedDays: attendanceInput?.attainedDays ?? 0,
        overtimeHours: attendanceInput?.overtimeHours ?? 0,
        overtimePay: calculation.overtimePay,
        lateHours: attendanceInput?.lateHours ?? 0,
        lateDays: attendanceInput?.lateDays ?? 0,
        leaveHours: attendanceInput?.leaveHours ?? 0,
        leaveDays: attendanceInput?.leaveDays ?? 0,
        daysWorked: attendanceInput?.daysWorked ?? 0,
        basicSalary: calculation.payableBasic,
        totalAllowance: calculation.totalAllowance,
        totalDeductions: calculation.totalDeductions,
        grossPay: calculation.grossPay,
        chargeableIncome: calculation.chargeableIncome,
        payeTax: calculation.payeTax,
        personalRelief: calculation.personalRelief,
        netPay: calculation.netPay,
        employerCosts: calculation.employerCosts,
        status: 'draft',
        note,
        paymentMethod,
        phoneNumber: phoneNumber || worker.phone,
        details: {
          create: calculation.componentDetails.map(detail => ({
            name: detail.componentName,
            type: detail.componentType,
            amount: detail.amount,
            isStatutory: detail.isStatutory,
          }))
        }
      },
      include: {
        details: true,
        worker: true,
        designation: true,
      }
    });

    return NextResponse.json(slip, { status: 201 });
  } catch (error) {
    console.error('Failed to create salary slip:', error);
    return NextResponse.json({ error: 'Failed to create salary slip' }, { status: 500 });
  }
}
