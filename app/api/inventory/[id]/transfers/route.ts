import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const transfers = await prisma.stockTransfer.findMany({
      where: { inventoryId: id },
      include: {
        fromSite: {
          select: {
            id: true,
            name: true,
            location: true,
          }
        },
        toSite: {
          select: {
            id: true,
            name: true,
            location: true,
          }
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(transfers);
  } catch (error) {
    console.error('Failed to fetch stock transfers:', error);
    return NextResponse.json({ error: 'Failed to fetch stock transfers' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (!body.toSiteId || !body.quantity) {
      return NextResponse.json({ error: 'Destination site and quantity are required' }, { status: 400 });
    }

    const inventory = await prisma.inventory.findUnique({
      where: { id },
      include: { site: true },
    });

    if (!inventory) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }

    if (inventory.quantity < body.quantity) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
    }

    const transfer = await prisma.stockTransfer.create({
      data: {
        inventoryId: id,
        fromSiteId: inventory.siteId,
        toSiteId: body.toSiteId,
        quantity: body.quantity,
        requestedBy: body.requestedBy || 'current-user',
        notes: body.notes,
        status: 'pending',
      },
      include: {
        fromSite: true,
        toSite: true,
        inventory: true,
      },
    });

    return NextResponse.json(transfer);
  } catch (error) {
    console.error('Failed to create stock transfer:', error);
    return NextResponse.json({ error: 'Failed to create stock transfer' }, { status: 500 });
  }
}