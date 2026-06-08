import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    const period = await prisma.payrollPeriod.update({
      where: { id },
      data: {
        name: body.name,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        status: body.status,
        description: body.description,
        totalEmployees: body.totalEmployees,
        totalGrossPay: body.totalGrossPay,
        totalNetPay: body.totalNetPay,
        totalDeductions: body.totalDeductions,
      },
    });
    return NextResponse.json(period);
  } catch (error) {
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
