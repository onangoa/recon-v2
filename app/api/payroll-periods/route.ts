import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractorId = searchParams.get('contractorId');

    const periods = await prisma.payrollPeriod.findMany({
      where: contractorId ? { contractorId } : {},
      include: {
        createdBy: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });
    return NextResponse.json(periods);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payroll periods' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const period = await prisma.payrollPeriod.create({
      data: {
        name: body.name,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        description: body.description,
        contractorId: body.contractorId,
        createdByWorkerId: body.createdByWorkerId,
        status: 'draft',
      },
    });
    return NextResponse.json(period, { status: 201 });
  } catch (error) {
    console.error('Failed to create payroll period:', error);
    return NextResponse.json({ error: 'Failed to create payroll period' }, { status: 500 });
  }
}
