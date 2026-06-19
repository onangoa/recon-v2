import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';

export async function GET(request: NextRequest) {
  try {
    const permCheck = await requirePermission(request, 'inventory:read');
    if (!permCheck.authorized) return permCheck.error;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    const where: any = {};

    const contractorFilter = permCheck.contractorId
      ? { OR: [{ contractorId: permCheck.contractorId }, { contractorId: null }] }
      : {};

    const searchFilter = search
      ? { OR: [{ name: { contains: search } }, { description: { contains: search } }] }
      : {};

    const combinedWhere = {
      ...contractorFilter,
      ...searchFilter,
    };

    const [categories, total] = await Promise.all([
      prisma.inventoryCategory.findMany({
        where: combinedWhere,
        include: {
          parent: true,
          subCategories: true,
          _count: {
            select: { inventory: true }
          }
        },
        orderBy: {
          name: 'asc'
        },
        skip,
        take: limit,
      }),
      prisma.inventoryCategory.count({ where: combinedWhere })
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

export async function POST(request: NextRequest) {
  try {
    const permCheck = await requirePermission(request, 'inventory:create');
    if (!permCheck.authorized) return permCheck.error;

    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const category = await prisma.inventoryCategory.create({
      data: {
        name: body.name,
        description: body.description,
        parentId: body.parentId || null,
        contractorId: permCheck.contractorId || null,
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