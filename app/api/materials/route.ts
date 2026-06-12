import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    
    const where: any = {};
    if (siteId) {
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
    return NextResponse.json(inventory);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.unit) {
      return NextResponse.json({ error: 'Unit is required' }, { status: 400 });
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
      userId: 'system',
      contractorId: inventory.site.contractorId,
      action: 'CREATE',
      module: 'INVENTORY',
      description: `Added inventory item: ${inventory.name}`,
      targetId: inventory.id,
      details: { name: inventory.name, quantity: inventory.quantity, unit: inventory.unit, status: inventory.status }
    });

    return NextResponse.json(inventory, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 });
  }
}
