import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const contractorId = auth.contractorId || auth.companyId;
  if (!contractorId) return mobileError('No company associated', 403);

  const periods = await prisma.payrollPeriod.findMany({
    where: { contractorId },
    orderBy: { createdAt: 'desc' },
  });

  return mobileSuccess(periods.map(p => ({
    id: p.id,
    name: p.name,
    start_date: p.startDate,
    end_date: p.endDate,
    status: p.status,
    description: p.description,
    total_employees: p.totalEmployees,
    total_gross_pay: p.totalGrossPay,
    total_net_pay: p.totalNetPay,
    total_deductions: p.totalDeductions,
    payment_status: p.paymentStatus,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  })));
}

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const contractorId = auth.contractorId;
  if (!contractorId) return mobileError('No company associated', 403);

  const body = await request.json();
  if (!body.name) return mobileError('Payroll period name is required', 400);
  if (!body.start_date || !body.end_date) return mobileError('Start and end dates are required', 400);

  const period = await prisma.payrollPeriod.create({
    data: {
      name: body.name,
      startDate: new Date(body.start_date),
      endDate: new Date(body.end_date),
      description: body.description || null,
      status: body.status || 'draft',
      paymentFrequency: body.payment_frequency || null,
      contractorId,
    },
  });

  return mobileSuccess({
    id: period.id,
    name: period.name,
    start_date: period.startDate,
    end_date: period.endDate,
    status: period.status,
  }, 'Payroll period created successfully');
}