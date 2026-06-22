import { NextRequest } from 'next/server';
import { mobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const { id } = await params;

  const component = await prisma.salaryComponent.findUnique({ where: { id } });
  if (!component) return Response.json({ success: false, message: 'Salary component not found' }, { status: 404 });

  return Response.json({
    success: true,
    data: {
      id: component.id,
      name: component.name,
      type: component.type,
      amount_type: component.calculationType || 'fixed',
      amount: String(component.amount || 0),
      percentage: String(component.percentage || 0),
      is_taxable: component.isTaxable,
      is_statutory: component.isStatutory,
      deduction_type: component.deductionType || null,
      is_active: component.isActive,
      description: component.description,
    },
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const { id } = await params;

  const body = await request.json();
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.type !== undefined) data.type = body.type;
  if (body.description !== undefined) data.description = body.description;
  if (body.amount !== undefined) data.amount = body.amount;
  if (body.is_percentage !== undefined) data.isPercentage = body.is_percentage;
  if (body.percentage !== undefined) data.percentage = body.percentage;
  if (body.calculation_type !== undefined) data.calculationType = body.calculation_type;
  if (body.deduction_type !== undefined) data.deductionType = body.deduction_type;
  if (body.is_statutory !== undefined) data.isStatutory = body.is_statutory;
  if (body.is_taxable !== undefined) data.isTaxable = body.is_taxable;
  if (body.sort_order !== undefined) data.sortOrder = body.sort_order;
  if (body.is_recurring !== undefined) data.isRecurring = body.is_recurring;
  if (body.is_active !== undefined) data.isActive = body.is_active;

  const component = await prisma.salaryComponent.update({ where: { id }, data });
  return Response.json({
    success: true,
    data: {
      id: component.id,
      name: component.name,
      type: component.type,
      amount_type: component.calculationType || 'fixed',
      amount: String(component.amount || 0),
      percentage: String(component.percentage || 0),
      is_taxable: component.isTaxable,
      is_statutory: component.isStatutory,
      deduction_type: component.deductionType || null,
      is_active: component.isActive,
      description: component.description,
    },
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  const { id } = await params;

  await prisma.salaryComponent.delete({ where: { id } });
  return Response.json({ success: true, message: 'Salary component deleted successfully' });
}