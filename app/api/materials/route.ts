import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const materials = await prisma.material.findMany({
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
    const material = await prisma.material.create({
      data: {
        siteId: body.siteId,
        name: body.name,
        categoryId: body.categoryId,
        quantity: body.quantity,
        unit: body.unit,
        unitCost: body.unitCost,
        totalCost: body.quantity * body.unitCost,
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
