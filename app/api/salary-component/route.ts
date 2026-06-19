import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const contractorId = auth.contractorId || auth.companyId;
  if (!contractorId) return mobileError('No company associated', 403);

  const components = await prisma.salaryComponent.findMany({
    where: { contractorId },
    orderBy: { sortOrder: 'asc' },
  });

  return mobileSuccess(components.map(c => ({
    id: c.id,
    name: c.name,
    type: c.type,
    description: c.description,
    amount: c.amount,
    is_percentage: c.isPercentage,
    percentage: c.percentage,
    calculation_type: c.calculationType,
    deduction_type: c.deductionType,
    is_statutory: c.isStatutory,
    is_taxable: c.isTaxable,
    sort_order: c.sortOrder,
    is_recurring: c.isRecurring,
    is_active: c.isActive,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  })));
}

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const contractorId = auth.contractorId;
  if (!contractorId) return mobileError('No company associated', 403);

  const body = await request.json();
  if (!body.name) return mobileError('Component name is required', 400);
  if (!body.type) return mobileError('Component type is required', 400);

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

  return mobileSuccess({
    id: component.id,
    name: component.name,
    type: component.type,
  }, 'Salary component created successfully');
}