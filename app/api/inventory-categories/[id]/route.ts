import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id } = await params;

  const category = await prisma.inventoryCategory.findUnique({ where: { id } });
  if (!category) return mobileError('Category not found', 404);

  return mobileSuccess({
    id: category.id,
    name: category.name,
    description: category.description,
    slug: category.slug,
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id } = await params;

  const body = await request.json();
  const category = await prisma.inventoryCategory.update({
    where: { id },
    data: { name: body.name, description: body.description },
  });

  return mobileSuccess({ id: category.id, name: category.name }, 'Category updated successfully');
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id } = await params;

  await prisma.inventoryCategory.delete({ where: { id } });
  return mobileSuccess(null, 'Category deleted successfully');
}