import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function POST(request: NextRequest) {
  try {
    const permCheck = await mobileRequirePermission(request, 'equipment:create');
    if (!permCheck.authorized) return permCheck.error!;

    const body = await request.json();
    const { equipment: items, siteId } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return mobileError('Equipment array is required', 400);
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

        if (!item.type && !item.machineType) {
          results.errors.push(`Row ${results.created + results.failed + 1}: Type is required`);
          results.failed++;
          continue;
        }

        await prisma.equipment.create({
          data: {
            siteId,
            name: item.name,
            type: item.machineType || item.type || 'general',
            serialNo: item.serialNo || null,
            serialNumber: item.serialNumber || null,
            rentalCost: item.rentalCost ? parseFloat(item.rentalCost) : null,
            dailyRate: item.dailyRate ? parseFloat(item.dailyRate) : null,
            status: item.status || 'Active',
            lastService: item.lastMaintenanceDate ? new Date(item.lastMaintenanceDate) : null,
            nextService: item.nextMaintenanceDate ? new Date(item.nextMaintenanceDate) : null,
          },
        });

        if (site) {
          await prisma.activityLog.create({
            data: {
              userId: permCheck.userId,
              contractorId: site.contractorId!,
              action: 'CREATE',
              module: 'EQUIPMENT',
              description: `Imported equipment: ${item.name}`,
              targetId: site.id,
            },
          });
        }

        results.created++;
      } catch (error: any) {
        results.errors.push(`Row ${results.created + results.failed + 1}: ${error.message || 'Unknown error'}`);
        results.failed++;
      }
    }

    return mobileSuccess(results, 'Equipment imported');
  } catch (error) {
    console.error('Mobile import equipment error:', error);
    return mobileError('Failed to import equipment', 500);
  }
}
