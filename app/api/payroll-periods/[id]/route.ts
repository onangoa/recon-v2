import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PayrollCalculator, SalaryComponentData } from '@/lib/payroll-calculator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const period = await prisma.payrollPeriod.findUnique({
      where: { id },
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
    return NextResponse.json(period);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payroll period' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, ...otherData } = body;

    // Check if we are starting processing
    if (status === 'processing') {
      // 1. Fetch the period and contractor info
      const period = await prisma.payrollPeriod.findUnique({
        where: { id },
        include: { contractor: true }
      });

      if (!period) return NextResponse.json({ error: 'Period not found' }, { status: 404 });

      // 2. Fetch all active workers for this contractor
      const workers = await prisma.worker.findMany({
        where: { contractorId: period.contractorId, status: 'Active' },
        include: { designation: true }
      });

      // 3. Fetch active salary components
      const components = await prisma.salaryComponent.findMany({
        where: { contractorId: period.contractorId, isActive: true }
      });

      let totalGross = 0;
      let totalNet = 0;
      let totalDeductions = 0;

      // 4. Generate Slips in a transaction (simulated or actual)
      for (const worker of workers) {
        if (!worker.designation) continue;

        // Calculate
        const calc = PayrollCalculator.calculate({
          basicSalary: worker.designation.salary || 0,
          components: components as unknown as SalaryComponentData[],
          includePersonalRelief: true,
        });

        // Upsert Salary Slip (prevent duplicates for same period/worker)
        await prisma.salarySlip.upsert({
          where: { 
            // We need a unique constraint in schema for this to work perfectly, 
            // but for now we'll delete existing and create new
            id: (await prisma.salarySlip.findFirst({ 
              where: { payrollPeriodId: id, workerId: worker.id } 
            }))?.id || 'new-id'
          },
          update: {
            basicSalary: calc.basicSalary,
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
                salaryComponentId: d.salaryComponentId,
                componentName: d.componentName,
                componentType: d.componentType,
                deductionType: d.deductionType,
                isStatutory: d.isStatutory,
                amount: d.amount,
                percentage: d.percentage,
              }))
            }
          },
          create: {
            contractorId: period.contractorId,
            payrollPeriodId: id,
            workerId: worker.id,
            designationId: worker.designationId,
            basicSalary: calc.basicSalary,
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
                salaryComponentId: d.salaryComponentId,
                componentName: d.componentName,
                componentType: d.componentType,
                deductionType: d.deductionType,
                isStatutory: d.isStatutory,
                amount: d.amount,
                percentage: d.percentage,
              }))
            }
          }
        });

        totalGross += calc.grossPay;
        totalNet += calc.netPay;
        totalDeductions += calc.totalDeductions;
      }

      // 5. Update period with totals and set status to completed (auto-transition for now)
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

      return NextResponse.json(updatedPeriod);
    }

    // Default update behavior
    const period = await prisma.payrollPeriod.update({
      where: { id },
      data: {
        name: body.name,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        status: status,
        description: body.description,
        totalEmployees: body.totalEmployees,
        totalGrossPay: body.totalGrossPay,
        totalNetPay: body.totalNetPay,
        totalDeductions: body.totalDeductions,
      },
    });
    return NextResponse.json(period);
  } catch (error) {
    console.error('Failed to update payroll period:', error);
    return NextResponse.json({ error: 'Failed to update payroll period' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
