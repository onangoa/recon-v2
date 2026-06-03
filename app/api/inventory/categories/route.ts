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
        { description: { contains: search } },
      ],
    } : {};

    const [categories, total] = await Promise.all([
      prisma.inventoryCategory.findMany({
        where,
        include: {
          parent: true,
          children: true,
          _count: {
            select: { materials: true }
          }
        },
        orderBy: {
          name: 'asc'
        },
        skip,
        take: limit,
      }),
      prisma.inventoryCategory.count({ where })
    ]);

    return NextResponse.json({
      categories,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const category = await prisma.inventoryCategory.create({
      data: {
        name: body.name,
        description: body.description,
        parentId: body.parentId || null,
      },
      include: {
        parent: true
      }
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Failed to create category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
