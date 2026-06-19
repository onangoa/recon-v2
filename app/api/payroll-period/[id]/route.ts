import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id } = await params;

  const period = await prisma.payrollPeriod.findUnique({
    where: { id },
    include: { salarySlips: true },
  });
  if (!period) return mobileError('Payroll period not found', 404);

  return mobileSuccess({
    id: period.id,
    name: period.name,
    start_date: period.startDate,
    end_date: period.endDate,
    status: period.status,
    description: period.description,
    total_employees: period.totalEmployees,
    total_gross_pay: period.totalGrossPay,
    total_net_pay: period.totalNetPay,
    total_deductions: period.totalDeductions,
    payment_status: period.paymentStatus,
    created_at: period.createdAt,
    updated_at: period.updatedAt,
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id } = await params;

  const body = await request.json();
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.start_date !== undefined) data.startDate = new Date(body.start_date);
  if (body.end_date !== undefined) data.endDate = new Date(body.end_date);
  if (body.status !== undefined) data.status = body.status;
  if (body.description !== undefined) data.description = body.description;
  if (body.payment_status !== undefined) data.paymentStatus = body.payment_status;

  const period = await prisma.payrollPeriod.update({ where: { id }, data });
  return mobileSuccess({ id: period.id, name: period.name, status: period.status }, 'Payroll period updated successfully');
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id } = await params;

  await prisma.payrollPeriod.delete({ where: { id } });
  return mobileSuccess(null, 'Payroll period deleted successfully');
}