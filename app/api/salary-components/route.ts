import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractorId = searchParams.get('contractorId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100'); // Default 100 for components as they are usually few
    const skip = (page - 1) * limit;

    const where = contractorId ? { contractorId } : {};

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
  try {
    const body = await request.json();
    const component = await prisma.salaryComponent.create({
      data: {
        name: body.name,
        type: body.type,
        deductionType: body.deductionType,
        calculationType: body.calculationType,
        amount: body.amount,
        percentage: body.percentage,
        isTaxable: body.isTaxable ?? true,
        isStatutory: body.isStatutory ?? false,
        isActive: body.isActive ?? true,
        description: body.description,
        sortOrder: body.sortOrder ?? 0,
        contractorId: body.contractorId,
      },
    });
    return NextResponse.json(component, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create salary component' }, { status: 500 });
  }
}
