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
  const permCheck = await mobileRequireContractorPermission(request, 'salary_components:read');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const contractorId = permCheck.contractorId!;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = (page - 1) * limit;

    const where = { contractorId };

    const [components, total] = await Promise.all([
      prisma.salaryComponent.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          sortOrder: 'asc',
        },
      }),
      prisma.salaryComponent.count({ where })
    ]);

    return mobileList(components, total, {
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return mobileError('Failed to fetch salary components', 500);
  }
}

export async function POST(request: NextRequest) {
  const permCheck = await mobileRequireContractorPermission(request, 'salary_components:create');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const body = await request.json();
    const contractorId = permCheck.contractorId!;

    if (!contractorId) {
      return mobileError('Contractor account required', 403);
    }

    const component = await prisma.salaryComponent.create({
      data: {
        name: body.name,
        type: body.type,
        deductionType: body.deductionType,
        calculationType: body.calculationType,
        amount: body.amount ? parseFloat(body.amount) : null,
        percentage: body.percentage ? parseFloat(body.percentage) : null,
        isPercentage: body.isPercentage ?? false,
        isTaxable: body.isTaxable ?? true,
        isStatutory: body.isStatutory ?? false,
        isActive: body.isActive ?? true,
        isRecurring: body.isRecurring ?? true,
        description: body.description,
        sortOrder: body.sortOrder ?? 0,
        contractorId,
      },
    });

    try {
      await ActivityLogger.log({
        userId: permCheck.userId || 'system',
        contractorId: component.contractorId,
        action: 'CREATE',
        module: 'PAYROLL',
        description: `Created salary component: ${component.name}`,
        targetId: component.id,
        details: { name: component.name, type: component.type, calculationType: component.calculationType }
      });
    } catch (logError) {
      console.error('Failed to record activity log:', logError);
    }

    return mobileSuccess(component, 'Salary component created');
  } catch (error) {
    console.error('Mobile create salary component error:', error);
    return mobileError('Failed to create salary component', 500);
  }
}
