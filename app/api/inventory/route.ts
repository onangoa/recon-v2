import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const siteId = searchParams.get('siteId');
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (siteId) {
      where.siteId = siteId;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { categoryRel: { name: { contains: search } } },
        { supplier: { contains: search } },
      ];
    }

    const [inventory, total] = await Promise.all([
      prisma.material.findMany({
        where,
        include: {
          categoryRel: true,
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
      prisma.material.count({ where })
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
  try {
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!body.siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const quantity = parseFloat(body.quantity) || 0;
    const unitCost = parseFloat(body.unitCost) || 0;
    
    if (!body.categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }
    
    if (!body.unit) {
      return NextResponse.json({ error: 'Unit is required' }, { status: 400 });
    }

    if (isNaN(quantity) || isNaN(unitCost)) {
      return NextResponse.json({ error: 'Quantity and Unit Cost must be valid numbers' }, { status: 400 });
    }
    
    const inventoryItem = await prisma.material.create({
      data: {
        site: {
          connect: { id: body.siteId }
        },
        name: body.name,
        description: body.description || null,
        sku: body.sku || null,
        barcode: body.barcode || null,
        categoryRel: body.categoryId ? {
          connect: { id: body.categoryId }
        } : undefined,
        unit: body.unit,
        quantity: quantity,
        unitCost: unitCost,
        totalCost: quantity * unitCost,
        minStockLevel: parseFloat(body.minStockLevel) || 0,
        maxStockLevel: body.maxStockLevel ? parseFloat(body.maxStockLevel) : null,
        reorderPoint: parseFloat(body.reorderPoint) || 0,
        location: body.location || null,
        supplier: body.supplier || null,
        supplierRel: body.supplierId ? {
          connect: { id: body.supplierId }
        } : undefined,
        status: body.status || 'pending',
        notes: body.notes || null,
      },
      include: {
        categoryRel: true,
        supplierRel: true,
        site: {
          include: {
            contractor: true
          }
        },
      },
    });

    await ActivityLogger.log({
      userId: 'system',
      contractorId: inventoryItem.site.contractorId,
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