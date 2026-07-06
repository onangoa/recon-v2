import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequirePermission(request, 'inventory:read');
  if (!permCheck.authorized) return permCheck.error!;
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

    return mobileSuccess(transfers);
  } catch (error) {
    console.error('Mobile fetch stock transfers error:', error);
    return mobileError('Failed to fetch stock transfers', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequirePermission(request, 'inventory:create');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.toSiteId || !body.quantity) {
      return mobileError('Destination site and quantity are required', 400);
    }

    const inventory = await prisma.inventory.findUnique({
      where: { id },
      include: { site: true },
    });

    if (!inventory) {
      return mobileError('Inventory item not found', 404);
    }

    if (inventory.quantity < body.quantity) {
      return mobileError('Insufficient stock', 400);
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

    return mobileSuccess(transfer, 'Stock transfer created');
  } catch (error) {
    console.error('Mobile create stock transfer error:', error);
    return mobileError('Failed to create stock transfer', 500);
  }
}
