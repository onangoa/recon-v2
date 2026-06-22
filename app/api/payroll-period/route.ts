import { NextRequest } from 'next/server';
import { mobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }

  const contractorId = auth.contractorId || auth.companyId;
  if (!contractorId) return Response.json({ success: false, message: 'Company ID is required' }, { status: 400 });

  try {
    const periods = await prisma.payrollPeriod.findMany({
      where: { contractorId },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json({
      success: true,
      data: periods.map(p => ({
        id: p.id,
        name: p.name,
        start_date: p.startDate ? p.startDate.toISOString().split('T')[0] : null,
        end_date: p.endDate ? p.endDate.toISOString().split('T')[0] : null,
        payment_date: p.paymentDate ? p.paymentDate.toISOString().split('T')[0] : null,
        status: p.status,
        total_employees: p.totalEmployees || 0,
        processed_employees: p.processedEmployees || 0,
        total_amount: String(p.totalNetPay || 0),
        description: p.description,
      })),
    });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }

  const contractorId = auth.contractorId;
  if (!contractorId) return Response.json({ success: false, message: 'Company ID is required' }, { status: 400 });

  const body = await request.json();
  if (!body.name) return Response.json({ success: false, message: 'Payroll period name is required' }, { status: 400 });
  if (!body.start_date || !body.end_date) return Response.json({ success: false, message: 'Start and end dates are required' }, { status: 400 });

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

  return Response.json({
    success: true,
    data: {
      id: period.id,
      name: period.name,
      start_date: period.startDate ? period.startDate.toISOString().split('T')[0] : null,
      end_date: period.endDate ? period.endDate.toISOString().split('T')[0] : null,
      payment_date: period.paymentDate ? period.paymentDate.toISOString().split('T')[0] : null,
      status: period.status,
      total_employees: 0,
      processed_employees: 0,
      total_amount: '0',
      description: period.description,
    },
  });
}