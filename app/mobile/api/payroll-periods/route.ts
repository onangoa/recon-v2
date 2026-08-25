import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import {
  mobileRequireContractorPermission,
  mobileSuccess,
  mobileError,
  mobileList,
} from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  const permCheck = await mobileRequireContractorPermission(request, 'payroll:read');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const contractorId = permCheck.contractorId!;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where = { contractorId };

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

    const enrichedPeriods = await Promise.all(periods.map(async (period) => {
      let workerCount = period.totalEmployees;

      if (period.status === 'draft') {
        workerCount = await prisma.worker.count({
          where: { contractorId: period.contractorId, status: 'Active' }
        });
      } else if (period._count.salarySlips > 0) {
        workerCount = period._count.salarySlips;
      }

      return {
        ...period,
        totalEmployees: workerCount
      };
    }));

    return mobileList(enrichedPeriods, total, {
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return mobileError('Failed to fetch payroll periods', 500);
  }
}

export async function POST(request: NextRequest) {
  const permCheck = await mobileRequireContractorPermission(request, 'payroll:create');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const body = await request.json();
    const contractorId = permCheck.contractorId!;

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

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId: contractorId,
      action: 'CREATE',
      module: 'PAYROLL',
      description: `Created payroll period: ${period.name}`,
      targetId: period.id,
      details: { name: period.name, status: period.status }
    });

    return mobileSuccess(period, 'Payroll period created');
  } catch (error) {
    console.error('Mobile create payroll period error:', error);
    return mobileError('Failed to create payroll period', 500);
  }
}
