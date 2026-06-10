import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractorId = searchParams.get('contractorId');

    // Fetch periods for the contractor (or all if none specified for now)
    const periods = await prisma.payrollPeriod.findMany({
      where: contractorId ? { contractorId } : {},
      include: {
        createdBy: true,
        _count: {
          select: { salarySlips: true }
        }
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
    
    // For demo/dev purposes, get the first contractor if ID is missing or placeholder
    let contractorId = body.contractorId;
    if (!contractorId || contractorId === 'placeholder-id') {
      const firstContractor = await prisma.contractor.findFirst();
      contractorId = firstContractor?.id;
    }

    if (!contractorId) {
      return NextResponse.json({ error: 'Contractor ID required' }, { status: 400 });
    }

    const period = await prisma.payrollPeriod.create({
      data: {
        name: body.name,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        description: body.description,
        contractorId: contractorId,
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
