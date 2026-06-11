import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const component = await prisma.salaryComponent.findUnique({
      where: { id },
    });
    if (!component) {
      return NextResponse.json({ error: 'Salary component not found' }, { status: 404 });
    }
    return NextResponse.json(component);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch salary component' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const component = await prisma.salaryComponent.update({
      where: { id },
      data: body,
    });

    await ActivityLogger.log({
      userId: 'system',
      contractorId: component.contractorId,
      action: 'UPDATE',
      module: 'PAYROLL',
      description: `Updated salary component: ${component.name}`,
      targetId: component.id,
      details: { name: component.name, type: component.type }
    });

    return NextResponse.json(component);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update salary component' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const component = await prisma.salaryComponent.findUnique({
      where: { id }
    });

    if (component) {
      await ActivityLogger.log({
        userId: 'system',
        contractorId: component.contractorId,
        action: 'DELETE',
        module: 'PAYROLL',
        description: `Deleted salary component: ${component.name}`,
        targetId: component.id,
        details: { name: component.name, type: component.type }
      });
    }

    await prisma.salaryComponent.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Salary component deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete salary component' }, { status: 500 });
  }
}
