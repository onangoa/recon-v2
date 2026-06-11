import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractorId = searchParams.get('contractorId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where = contractorId ? { contractorId } : {};

    const [periods, total] = await Promise.all([
      prisma.payrollPeriod.findMany({
        where,
        include: {
          createdBy: true,
          _count: {
            select: { salarySlips: true }
          }
        },
        skip,
        take: limit,
        orderBy: { startDate: 'desc' }
      }),
      prisma.payrollPeriod.count({ where })
    ]);

    // Enrich periods with accurate worker count
    const enrichedPeriods = await Promise.all(periods.map(async (period) => {
      let workerCount = period.totalEmployees;
      
      if (period.status === 'draft') {
        const workerWhere: any = { 
          contractorId: period.contractorId, 
          status: 'Active' 
        };
        if (period.paymentFrequency && period.paymentFrequency !== 'all') {
          workerWhere.designation = {
            paymentFrequency: period.paymentFrequency
          };
        }
        workerCount = await prisma.worker.count({ where: workerWhere });
      } else if (period._count.salarySlips > 0) {
        workerCount = period._count.salarySlips;
      }
      
      return {
        ...period,
        totalEmployees: workerCount
      };
    }));

    return NextResponse.json({
      periods: enrichedPeriods,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
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
        paymentFrequency: body.paymentFrequency || 'monthly',
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
