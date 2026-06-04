import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { name: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } },
      ],
    } : {};

    const [inventory, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: {
          name: 'asc'
        },
        skip,
        take: limit,
      }),
      prisma.inventoryItem.count({ where })
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

    const inventoryItem = await prisma.inventoryItem.create({
      data: {
        name: body.name,
        description: body.description || null,
        sku: body.sku || null,
        barcode: body.barcode || null,
        categoryId: body.categoryId || null,
        unit: body.unit || null,
        quantity: body.quantity || 0,
        minStockLevel: body.minStockLevel || 0,
        maxStockLevel: body.maxStockLevel || null,
        reorderPoint: body.reorderPoint || 0,
        unitPrice: body.unitPrice ? parseFloat(body.unitPrice) : 0,
        totalPrice: body.unitPrice && body.quantity ? (parseFloat(body.unitPrice) * body.quantity) : 0,
        location: body.location || null,
        supplierId: body.supplierId || null,
        notes: body.notes || null,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(inventoryItem);
  } catch (error) {
    console.error('Failed to create inventory item:', error);
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 });
  }
}