import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    
    const where: any = {};
    if (siteId) {
      where.siteId = siteId;
    }

    const materials = await prisma.material.findMany({
      where,
      include: {
        categoryRel: true,
        site: {
          include: {
            contractor: true
          }
        },
      },
    });
    return NextResponse.json(materials);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.unit) {
      return NextResponse.json({ error: 'Unit is required' }, { status: 400 });
    }
    
    const material = await prisma.material.create({
      data: {
        site: {
          connect: { id: body.siteId }
        },
        name: body.name,
        categoryRel: body.categoryId ? {
          connect: { id: body.categoryId }
        } : undefined,
        quantity: body.quantity || 0,
        unit: body.unit,
        unitCost: body.unitCost || 0,
        totalCost: (body.quantity || 0) * (body.unitCost || 0),
        supplier: body.supplier,
        status: body.status || 'pending',
      },
      include: {
        categoryRel: true,
        site: {
          include: {
            contractor: true
          }
        },
      },
    });
    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create material' }, { status: 500 });
  }
}
