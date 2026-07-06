import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function POST(request: NextRequest) {
  try {
    const permCheck = await mobileRequirePermission(request, 'inventory:create');
    if (!permCheck.authorized) return permCheck.error!;

    const body = await request.json();
    const { categories } = body;

    if (!Array.isArray(categories) || categories.length === 0) {
      return mobileError('Categories array is required', 400);
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
            contractorId: permCheck.contractorId || null,
          },
        });
        results.created++;
      } catch (error: any) {
        results.errors.push(`Row ${results.created + results.failed + 1}: ${error.message || 'Unknown error'}`);
        results.failed++;
      }
    }

    return mobileSuccess(results, 'Categories imported');
  } catch (error) {
    console.error('Mobile import categories error:', error);
    return mobileError('Failed to import categories', 500);
  }
}
