import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const contractorId = auth.contractorId;
  if (!contractorId) return mobileError('No company associated', 403);

  const categories = await prisma.inventoryCategory.findMany({
    where: { OR: [{ contractorId }, { contractorId: null }] },
    orderBy: { name: 'asc' },
  });

  return mobileSuccess(categories.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    slug: c.slug,
    parent_id: c.parentId,
  })));
}

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const contractorId = auth.contractorId;
  if (!contractorId) return mobileError('No company associated', 403);

  const body = await request.json();
  const category = await prisma.inventoryCategory.create({
    data: {
      name: body.name,
      description: body.description,
      contractorId,
    },
  });

  return mobileSuccess({
    id: category.id,
    name: category.name,
    description: category.description,
  }, 'Category created successfully');
}