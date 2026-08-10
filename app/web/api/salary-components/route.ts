import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { requireContractorPermission } from '@/lib/require-permission';

export async function GET(request: NextRequest) {
  const permCheck = await requireContractorPermission(request, 'salary_components:read');
  if (!permCheck.authorized) return permCheck.error;
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

    return NextResponse.json({
      components,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch salary components' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const permCheck = await requireContractorPermission(request, 'salary_components:create');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const body = await request.json();
    const contractorId = permCheck.contractorId!;

    const contractor = await prisma.contractor.findUnique({
      where: { id: contractorId },
      select: { id: true },
    });

    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
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

    return NextResponse.json(component, { status: 201 });
  } catch (error) {
    console.error('Failed to create salary component:', error);
    return NextResponse.json({ error: 'Failed to create salary component' }, { status: 500 });
  }
}
