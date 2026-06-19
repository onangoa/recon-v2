import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { categories } = body;

    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json({ error: 'Categories array is required' }, { status: 400 });
    }

    const results = { created: 0, failed: 0, errors: [] as string[] };

    for (const cat of categories) {
      try {
        if (!cat.name) {
          results.errors.push(`Row ${results.created + results.failed + 1}: Name is required`);
          results.failed++;
          continue;
        }

        await prisma.inventoryCategory.create({
          data: {
            name: cat.name,
            description: cat.description || null,
            parentId: cat.parentId || null,
            contractorId: auth.contractorId || null,
          },
        });
        results.created++;
      } catch (error: any) {
        results.errors.push(`Row ${results.created + results.failed + 1}: ${error.message || 'Unknown error'}`);
        results.failed++;
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to import categories:', error);
    return NextResponse.json({ error: 'Failed to import categories' }, { status: 500 });
  }
}