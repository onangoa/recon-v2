import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractorId = searchParams.get('contractorId');

    const components = await prisma.salaryComponent.findMany({
      where: contractorId ? { contractorId } : {},
      orderBy: {
        sortOrder: 'asc',
      },
    });
    return NextResponse.json(components);
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
