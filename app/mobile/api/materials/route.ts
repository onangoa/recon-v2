import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import {
  mobileRequireContractorPermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';
import { verifySiteOwnership } from '@/lib/contractor-isolation';

export async function GET(request: NextRequest) {
  try {
    const permCheck = await mobileRequireContractorPermission(request, 'materials:read');
    if (!permCheck.authorized) return permCheck.error!;

    const contractorId = permCheck.contractorId!;
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    const where: any = { site: { contractorId } };
    if (siteId) {
      const owns = await verifySiteOwnership(contractorId, siteId);
      if (!owns) {
        return mobileError('Site not found', 404);
      }
      where.siteId = siteId;
    }

    const inventory = await prisma.inventory.findMany({
      where,
      include: {
        category: true,
        site: {
          include: {
            contractor: true
          }
        },
      },
    });
    return mobileSuccess(inventory);
  } catch (error) {
    console.error('Mobile fetch materials error:', error);
    return mobileError('Failed to fetch inventory', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const permCheck = await mobileRequireContractorPermission(request, 'materials:create');
    if (!permCheck.authorized) return permCheck.error!;

    const contractorId = permCheck.contractorId!;
    const body = await request.json();
    if (!body.unit) {
      return mobileError('Unit is required', 400);
    }

    if (body.siteId) {
      const owns = await verifySiteOwnership(contractorId, body.siteId);
      if (!owns) {
        return mobileError('Site not found', 404);
      }
    }

    const inventory = await prisma.inventory.create({
      data: {
        siteId: body.siteId,
        name: body.name,
        description: body.description,
        categoryId: body.categoryId,
        quantity: body.quantity || 0,
        unit: body.unit,
        minStock: body.minStock || 0,
        location: body.location,
        status: body.status || 'in-stock',
      },
      include: {
        category: true,
        site: {
          include: {
            contractor: true
          }
        },
      },
    });

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId,
      action: 'CREATE',
      module: 'INVENTORY',
      description: `Added inventory item: ${inventory.name}`,
      targetId: inventory.id,
      details: { name: inventory.name, quantity: inventory.quantity, unit: inventory.unit, status: inventory.status }
    });

    return mobileSuccess(inventory, 'Inventory item created');
  } catch (error) {
    console.error('Mobile create material error:', error);
    return mobileError('Failed to create inventory item', 500);
  }
}
