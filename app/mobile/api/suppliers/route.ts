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
    const permCheck = await mobileRequirePermission(request, 'suppliers:read');
    if (!permCheck.authorized) return permCheck.error!;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    const where: any = {};

    if (permCheck.contractorId) {
      where.OR = [
        { contractorId: permCheck.contractorId },
        { contractorId: null },
      ];
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search } },
            { contactPerson: { contains: search } },
            { email: { contains: search } },
          ],
        },
      ];
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy: {
          name: 'asc'
        },
        skip,
        take: limit,
      }),
      prisma.supplier.count({ where })
    ]);

    return mobileList(suppliers, total, {
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Mobile fetch suppliers error:', error);
    return mobileError('Failed to fetch suppliers', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const permCheck = await mobileRequirePermission(request, 'suppliers:create');
    if (!permCheck.authorized) return permCheck.error!;

    const body = await request.json();

    if (!body.name) {
      return mobileError('Name is required', 400);
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: body.name,
        contactPerson: body.contactPerson || null,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        contractorId: permCheck.contractorId || null,
      },
    });

    return mobileSuccess(supplier, 'Supplier created');
  } catch (error) {
    console.error('Mobile create supplier error:', error);
    return mobileError('Failed to create supplier', 500);
  }
}
