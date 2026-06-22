import { NextRequest } from 'next/server';
import { mobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }

  const contractorId = auth.contractorId || auth.companyId;
  if (!contractorId) return Response.json({ success: false, message: 'Company ID is required' }, { status: 400 });

  try {
    const components = await prisma.salaryComponent.findMany({
      where: { contractorId },
      orderBy: { sortOrder: 'asc' },
    });

    return Response.json({
      success: true,
      data: components.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        amount_type: c.calculationType || 'fixed',
        amount: String(c.amount || 0),
        percentage: String(c.percentage || 0),
        is_taxable: c.isTaxable,
        is_statutory: c.isStatutory,
        deduction_type: c.deductionType || null,
        is_active: c.isActive,
        description: c.description,
      })),
    });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }

  const contractorId = auth.contractorId;
  if (!contractorId) return Response.json({ success: false, message: 'Company ID is required' }, { status: 400 });

  const body = await request.json();
  if (!body.name) return Response.json({ success: false, message: 'Component name is required' }, { status: 400 });
  if (!body.type) return Response.json({ success: false, message: 'Component type is required' }, { status: 400 });

  try {
    const component = await prisma.salaryComponent.create({
      data: {
        name: body.name,
        type: body.type,
        description: body.description || null,
        amount: body.amount || null,
        isPercentage: body.is_percentage || false,
        percentage: body.percentage || null,
        calculationType: body.calculation_type || null,
        deductionType: body.deduction_type || null,
        isStatutory: body.is_statutory || false,
        isTaxable: body.is_taxable !== undefined ? body.is_taxable : true,
        sortOrder: body.sort_order || 0,
        isRecurring: body.is_recurring !== undefined ? body.is_recurring : true,
        isActive: body.is_active !== undefined ? body.is_active : true,
        contractorId,
      },
    });

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
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}