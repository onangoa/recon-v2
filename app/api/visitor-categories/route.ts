import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';

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
  return mobileSuccess([...categories, ...customCategories]);
}

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const body = await request.json();
  if (!body.name) return mobileError('Category name is required', 400);

  const category = {
    id: String(nextId++),
    name: body.name,
    description: body.description || '',
  };
  customCategories.push(category);

  return mobileSuccess(category, 'Visitor category created successfully');
}