import { NextRequest } from 'next/server';
import { mobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const { id } = await params;

  const period = await prisma.payrollPeriod.findUnique({
    where: { id },
    include: { salarySlips: true },
  });
  if (!period) return Response.json({ success: false, message: 'Payroll period not found' }, { status: 404 });

  return Response.json({
    success: true,
    data: {
      id: period.id,
      name: period.name,
      start_date: period.startDate ? period.startDate.toISOString().split('T')[0] : null,
      end_date: period.endDate ? period.endDate.toISOString().split('T')[0] : null,
      payment_date: period.paymentDate ? period.paymentDate.toISOString().split('T')[0] : null,
      status: period.status,
      total_employees: period.totalEmployees || 0,
      processed_employees: period.processedEmployees || 0,
      total_amount: String(period.totalNetPay || 0),
      description: period.description,
    },
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
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
  return Response.json({
    success: true,
    data: {
      id: period.id,
      name: period.name,
      start_date: period.startDate ? period.startDate.toISOString().split('T')[0] : null,
      end_date: period.endDate ? period.endDate.toISOString().split('T')[0] : null,
      payment_date: period.paymentDate ? period.paymentDate.toISOString().split('T')[0] : null,
      status: period.status,
      total_employees: period.totalEmployees || 0,
      processed_employees: period.processedEmployees || 0,
      total_amount: String(period.totalNetPay || 0),
      description: period.description,
    },
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const { id } = await params;

  await prisma.payrollPeriod.delete({ where: { id } });
  return Response.json({ success: true, message: 'Payroll period deleted successfully' });
}