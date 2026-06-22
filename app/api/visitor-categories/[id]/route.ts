import { NextRequest } from 'next/server';
import { mobileAuth } from '@/lib/mobile-auth';

const categories: any[] = [];
let nextId = 100;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ error: true, message: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  const category = categories.find(c => c.id === id);
  if (!category) return Response.json({ error: true, message: 'Category not found' }, { status: 404 });

  return Response.json({ error: false, category });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ error: true, message: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  const body = await request.json();
  const idx = categories.findIndex(c => c.id === id);
  if (idx === -1) return Response.json({ error: true, message: 'Category not found' }, { status: 404 });

  if (body.name !== undefined) categories[idx].name = body.name;
  if (body.description !== undefined) categories[idx].description = body.description;

  return Response.json({
    error: false,
    message: 'Visitor category updated successfully.',
    category: categories[idx],
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ error: true, message: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  const idx = categories.findIndex(c => c.id === id);
  if (idx === -1) return Response.json({ error: true, message: 'Category not found' }, { status: 404 });

  categories.splice(idx, 1);
  return Response.json({ error: false, message: 'Visitor category deleted successfully.' });
}