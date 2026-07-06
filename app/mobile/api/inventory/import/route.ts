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
    const { items, siteId } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return mobileError('Items array is required', 400);
    }

    if (!siteId) {
      return mobileError('Site ID is required', 400);
    }

    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      return mobileError('Site not found', 404);
    }

    const results = { created: 0, failed: 0, errors: [] as string[] };

    for (const item of items) {
      try {
        if (!item.name) {
          results.errors.push(`Row ${results.created + results.failed + 1}: Name is required`);
          results.failed++;
          continue;
        }

        await prisma.inventory.create({
          data: {
            siteId,
            name: item.name,
            description: item.description || null,
            sku: item.sku || null,
            categoryId: item.categoryId || null,
            quantity: parseFloat(item.quantity) || 0,
            unitCost: parseFloat(item.unitCost) || 0,
            unit: item.unit || 'pcs',
            minStock: parseFloat(item.minStock) || 0,
            location: item.location || null,
            status: item.status || 'in-stock',
          },
        });
        results.created++;
      } catch (error: any) {
        results.errors.push(`Row ${results.created + results.failed + 1}: ${error.message || 'Unknown error'}`);
        results.failed++;
      }
    }

    return mobileSuccess(results, 'Inventory imported');
  } catch (error) {
    console.error('Mobile import inventory error:', error);
    return mobileError('Failed to import inventory', 500);
  }
}
