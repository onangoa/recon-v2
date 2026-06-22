import { NextRequest } from 'next/server';
import { mobileAuth, mobileErrorOk, mobileSuccessOk, cuidToInt } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }

  const contractorId = auth.contractorId;
  if (!contractorId) return mobileErrorOk('No company associated', 403);

  const categories = await prisma.inventoryCategory.findMany({
    where: { OR: [{ contractorId }, { contractorId: null }] },
    orderBy: { name: 'asc' },
  });

  const rows = categories.map(c => ({
    id: cuidToInt(c.id),
    name: c.name,
    description: c.description,
    parent_category: c.parentId ? 'Yes' : 'No',
    items_count: 0,
    is_parent: c.parentId ? 'No' : 'Yes',
    status: 'Active',
    obj_status: 'Active',
    actions: '',
  }));

  return Response.json({ total: rows.length, rows });
}

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }

  const contractorId = auth.contractorId;
  if (!contractorId) return mobileErrorOk('No company associated', 403);

  const body = await request.json();
  if (!body.name) return mobileErrorOk('Category name is required', 422);

  const category = await prisma.inventoryCategory.create({
    data: {
      name: body.name,
      description: body.description,
      contractorId,
    },
  });

  return Response.json({
    success: true,
    message: 'Inventory category created successfully.',
    category: {
      id: cuidToInt(category.id),
      name: category.name,
      description: category.description,
    },
  });
}