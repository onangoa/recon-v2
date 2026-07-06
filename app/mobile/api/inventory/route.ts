import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import {
  mobileRequireContractorPermission,
  mobileSuccess,
  mobileError,
  mobileList,
} from '@/lib/mobile-auth';
import { verifySiteOwnership } from '@/lib/contractor-isolation';

export async function GET(request: NextRequest) {
  try {
    const permCheck = await mobileRequireContractorPermission(request, 'inventory:read');
    if (!permCheck.authorized) return permCheck.error!;

    const contractorId = permCheck.contractorId!;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const siteId = searchParams.get('siteId');
    const skip = (page - 1) * limit;

    const where: any = { site: { contractorId } };

    if (siteId) {
      const owns = await verifySiteOwnership(contractorId, siteId);
      if (!owns) {
        return mobileError('Site not found', 404);
      }
      where.siteId = siteId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { category: { name: { contains: search } } },
      ];
    }

    const [inventory, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: {
          category: true,
          site: {
            include: {
              contractor: true
            }
          },
        },
        orderBy: {
          name: 'asc'
        },
        skip,
        take: limit,
      }),
      prisma.inventory.count({ where })
    ]);

    return mobileList(inventory, total, {
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Mobile fetch inventory error:', error);
    return mobileError('Failed to fetch inventory', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const permCheck = await mobileRequireContractorPermission(request, 'inventory:create');
    if (!permCheck.authorized) return permCheck.error!;

    const contractorId = permCheck.contractorId!;
    const body = await request.json();

    if (!body.name) {
      return mobileError('Name is required', 400);
    }

    if (!body.siteId) {
      return mobileError('Site ID is required', 400);
    }

    const owns = await verifySiteOwnership(contractorId, body.siteId);
    if (!owns) {
      return mobileError('Site not found', 404);
    }

    const quantity = parseFloat(body.quantity) || 0;

    if (!body.unit) {
      return mobileError('Unit is required', 400);
    }

    if (isNaN(quantity)) {
      return mobileError('Quantity must be a valid number', 400);
    }

    const inventoryItem = await prisma.inventory.create({
      data: {
        siteId: body.siteId,
        name: body.name,
        description: body.description || null,
        sku: body.sku || null,
        categoryId: body.categoryId || null,
        quantity: quantity,
        unitCost: parseFloat(body.unitCost) || 0,
        unit: body.unit,
        minStock: parseFloat(body.minStockLevel ?? body.minStock) || 0,
        maxStockLevel: body.maxStockLevel != null && body.maxStockLevel !== '' ? parseFloat(body.maxStockLevel) : null,
        reorderPoint: body.reorderPoint != null && body.reorderPoint !== '' ? parseFloat(body.reorderPoint) : null,
        location: body.location || null,
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
      description: `Added inventory item: ${inventoryItem.name}`,
      targetId: inventoryItem.id,
      details: { name: inventoryItem.name, quantity: inventoryItem.quantity, unit: inventoryItem.unit, status: inventoryItem.status }
    });

    return mobileSuccess(inventoryItem, 'Inventory item created');
  } catch (error) {
    console.error('Mobile create inventory error:', error);
    return mobileError('Failed to create inventory item', 500);
  }
}
