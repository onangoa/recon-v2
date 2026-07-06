import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
  mobileList,
} from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  try {
    const permCheck = await mobileRequirePermission(request, 'inventory:read');
    if (!permCheck.authorized) return permCheck.error!;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

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

    return mobileList(categories, total, {
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Mobile fetch categories error:', error);
    return mobileError('Failed to fetch categories', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const permCheck = await mobileRequirePermission(request, 'inventory:create');
    if (!permCheck.authorized) return permCheck.error!;

    const body = await request.json();

    if (!body.name) {
      return mobileError('Name is required', 400);
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

    return mobileSuccess(category, 'Category created');
  } catch (error) {
    console.error('Mobile create category error:', error);
    return mobileError('Failed to create category', 500);
  }
}
