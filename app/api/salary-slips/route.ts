import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PayrollCalculator, SalaryComponentData } from '@/lib/payroll-calculator';
import { requirePermission } from '@/lib/require-permission';

export async function GET(request: NextRequest) {
  const permCheck = await requirePermission(request, 'salary_slips:read');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const { searchParams } = new URL(request.url);
    const payrollPeriodId = searchParams.get('payrollPeriodId');
    const workerId = searchParams.get('workerId');

    const slips = await prisma.salarySlip.findMany({
      where: {
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
  const permCheck = await requirePermission(request, 'salary_slips:create');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const body = await request.json();
    const { 
      workerId, 
      payrollPeriodId, 
      contractorId, 
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
      include: { designation: true }
    });

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
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

    // Calculate payroll
    const calculation = PayrollCalculator.calculate({
      basicSalary: designation.salary || 0,
      components: components as unknown as SalaryComponentData[],
      includePersonalRelief: true,
    });

    // Create salary slip
    const slip = await prisma.salarySlip.create({
      data: {
        contractorId,
        payrollPeriodId,
        workerId,
        designationId: designation.id,
        workingHours: workingHours || 0,
        attainedHours: attainedHours || 0,
        workingDays: workingDays || 0,
        attainedDays: attainedDays || 0,
        overtimeHours: overtimeHours || 0,
        lateHours: lateHours || 0,
        lateDays: lateDays || 0,
        leaveHours: leaveHours || 0,
        leaveDays: leaveDays || 0,
        basicSalary: calculation.basicSalary,
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
            salaryComponentId: detail.salaryComponentId,
            componentName: detail.componentName,
            componentType: detail.componentType,
            deductionType: detail.deductionType,
            isStatutory: detail.isStatutory,
            amount: detail.amount,
            percentage: detail.percentage,
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
