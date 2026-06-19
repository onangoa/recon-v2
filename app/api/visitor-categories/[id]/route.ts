import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';

const categories: any[] = [];
let nextId = 100;

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id } = await params;

  const body = await request.json();
  const idx = categories.findIndex(c => c.id === id);
  if (idx === -1) return mobileError('Category not found', 404);

  if (body.name !== undefined) categories[idx].name = body.name;
  if (body.description !== undefined) categories[idx].description = body.description;

  return mobileSuccess(categories[idx], 'Category updated successfully');
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id } = await params;

  const idx = categories.findIndex(c => c.id === id);
  if (idx === -1) return mobileError('Category not found', 404);

  categories.splice(idx, 1);
  return mobileSuccess(null, 'Category deleted successfully');
}