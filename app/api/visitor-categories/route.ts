import { NextRequest } from 'next/server';
import { mobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

const categories = [
  { id: '1', name: 'Contractor', description: 'Contractor visitors' },
  { id: '2', name: 'Client', description: 'Client visitors' },
  { id: '3', name: 'Delivery', description: 'Delivery personnel' },
  { id: '4', name: 'Inspector', description: 'Government inspectors' },
  { id: '5', name: 'Interview', description: 'Job interview candidates' },
  { id: '6', name: 'Other', description: 'Other visitors' },
];

let customCategories: any[] = [];
let nextId = 100;

export async function GET() {
  const allCategories = [...categories, ...customCategories];
  return Response.json({
    total: allCategories.length,
    rows: allCategories.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      parent_category: 'None',
      visitors_count: 0,
      is_parent: 'Yes',
      status: 'Active',
      obj_status: 'Active',
      actions: '',
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ error: true, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  if (!body.name) return Response.json({ error: true, message: 'Category name is required' }, { status: 400 });

  const category = {
    id: String(nextId++),
    name: body.name,
    description: body.description || '',
  };
  customCategories.push(category);

  return Response.json({
    error: false,
    message: 'Visitor category created successfully.',
    category: { id: category.id, name: category.name, description: category.description },
  });
}