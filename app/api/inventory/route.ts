import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
        { category: { contains: search } },
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
              project: true
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
    
    const inventoryItem = await prisma.material.create({
      data: {
        siteId: body.siteId,
        name: body.name,
        category: body.category || 'Uncategorized',
        categoryId: body.categoryId || null,
        unit: body.unit || null,
        quantity: quantity,
        unitCost: unitCost,
        totalCost: quantity * unitCost,
        supplier: body.supplier || null,
        status: body.status || 'pending',
      },
      include: {
        categoryRel: true,
        site: {
          include: {
            project: true
          }
        },
      },
    });

    return NextResponse.json(inventoryItem);
  } catch (error) {
    console.error('Failed to create inventory item:', error);
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 });
  }
}