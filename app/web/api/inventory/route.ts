import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { requireContractorPermission } from '@/lib/require-permission';
import { verifySiteOwnership } from '@/lib/contractor-isolation';

export async function GET(request: Request) {
  const permCheck = await requireContractorPermission(request as any, 'inventory:read');
  if (!permCheck.authorized) return permCheck.error;
  try {
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
        return NextResponse.json({ error: 'Site not found' }, { status: 404 });
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

    return NextResponse.json({
      inventory,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Failed to fetch inventory:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const permCheck = await requireContractorPermission(request as any, 'inventory:create');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;
  try {
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!body.siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const owns = await verifySiteOwnership(contractorId, body.siteId);
    if (!owns) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const quantity = parseFloat(body.quantity) || 0;
    
    if (!body.unit) {
      return NextResponse.json({ error: 'Unit is required' }, { status: 400 });
    }

    if (isNaN(quantity)) {
      return NextResponse.json({ error: 'Quantity must be a valid number' }, { status: 400 });
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

    return NextResponse.json(inventoryItem);
  } catch (error) {
    console.error('Failed to create inventory item:', error);
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 });
  }
}