import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { requirePermission } from '@/lib/require-permission';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requirePermission(request, 'salary_components:read');
  if (!permCheck.authorized) return permCheck.error;
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
  const permCheck = await requirePermission(request, 'salary_components:update');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const { id } = await params;
    const body = await request.json();
    
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.type !== undefined) data.type = body.type;
    if (body.deductionType !== undefined) data.deductionType = body.deductionType;
    if (body.calculationType !== undefined) data.calculationType = body.calculationType;
    if (body.amount !== undefined) data.amount = body.amount ? parseFloat(body.amount) : null;
    if (body.percentage !== undefined) data.percentage = body.percentage ? parseFloat(body.percentage) : null;
    if (body.isPercentage !== undefined) data.isPercentage = body.isPercentage;
    if (body.isTaxable !== undefined) data.isTaxable = body.isTaxable;
    if (body.isStatutory !== undefined) data.isStatutory = body.isStatutory;
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.isRecurring !== undefined) data.isRecurring = body.isRecurring;
    if (body.description !== undefined) data.description = body.description;
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;
    
    const component = await prisma.salaryComponent.update({
      where: { id },
      data,
    });

    try {
      const contractor = await prisma.contractor.findFirst();
      if (contractor) {
        await ActivityLogger.log({
          userId: contractor.userId || 'system',
          contractorId: component.contractorId,
          action: 'UPDATE',
          module: 'PAYROLL',
          description: `Updated salary component: ${component.name}`,
          targetId: component.id,
          details: { name: component.name, type: component.type }
        });
      }
    } catch (logError) {
      console.error('Failed to record activity log:', logError);
    }

    return NextResponse.json(component);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update salary component' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requirePermission(request, 'salary_components:delete');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const { id } = await params;
    const component = await prisma.salaryComponent.findUnique({
      where: { id }
    });

    if (component) {
      try {
        const contractor = await prisma.contractor.findFirst();
        if (contractor) {
          await ActivityLogger.log({
            userId: contractor.userId || 'system',
            contractorId: component.contractorId,
            action: 'DELETE',
            module: 'PAYROLL',
            description: `Deleted salary component: ${component.name}`,
            targetId: component.id,
            details: { name: component.name, type: component.type }
          });
        }
      } catch (logError) {
        console.error('Failed to record activity log:', logError);
      }
    }

    await prisma.salaryComponent.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Salary component deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete salary component' }, { status: 500 });
  }
}
