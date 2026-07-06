import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import {
  mobileRequireContractorPermission,
  mobileSuccess,
  mobileError,
  mobileList,
} from '@/lib/mobile-auth';
import { verifySiteOwnership } from '@/lib/contractor-isolation';

export async function GET(request: NextRequest) {
  try {
    const permCheck = await mobileRequireContractorPermission(request, 'purchase_orders:read');
    if (!permCheck.authorized) return permCheck.error!;

    const contractorId = permCheck.contractorId!;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const siteId = searchParams.get('siteId');
    const skip = (page - 1) * limit;

    const where: any = { site: { contractorId } };

    if (siteId) {
      const owns = await verifySiteOwnership(contractorId, siteId);
      if (!owns) {
        return mobileError('Site not found', 404);
      }
      where.siteId = siteId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { supplier: { name: { contains: search } } },
      ];
    }

    const [purchaseOrders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: true,
          items: true,
          site: true,
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit,
      }),
      prisma.purchaseOrder.count({ where })
    ]);

    return mobileList(purchaseOrders, total, {
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Mobile fetch purchase orders error:', error);
    return mobileError('Failed to fetch purchase orders', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const permCheck = await mobileRequireContractorPermission(request, 'purchase_orders:create');
    if (!permCheck.authorized) return permCheck.error!;

    const contractorId = permCheck.contractorId!;
    const body = await request.json();

    if (!body.orderNumber) {
      return mobileError('Order number is required', 400);
    }

    if (!body.supplierId) {
      return mobileError('Supplier is required', 400);
    }

    if (body.siteId) {
      const owns = await verifySiteOwnership(contractorId, body.siteId);
      if (!owns) {
        return mobileError('Site not found', 404);
      }
    }

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        siteId: body.siteId,
        supplierId: body.supplierId,
        orderNumber: body.orderNumber,
        status: body.status || 'pending',
        subtotal: body.subtotal || 0,
        tax: body.tax || 0,
        total: body.total || 0,
        orderDate: body.orderDate ? new Date(body.orderDate) : new Date(),
        expectedDeliveryDate: body.expectedDeliveryDate ? new Date(body.expectedDeliveryDate) : null,
        notes: body.notes || null,
        items: body.items ? {
          create: body.items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            totalPrice: (item.quantity || 1) * (item.unitPrice || 0),
            materialId: item.materialId || null,
          }))
        } : undefined,
      },
      include: {
        supplier: true,
        items: true,
        site: true,
      },
    });

    if (purchaseOrder.site) {
      await ActivityLogger.log({
        userId: permCheck.userId || 'system',
        contractorId,
        action: 'CREATE',
        module: 'PURCHASE_ORDERS',
        description: `Created purchase order: ${purchaseOrder.orderNumber}`,
        targetId: purchaseOrder.id,
        details: { orderNumber: purchaseOrder.orderNumber, total: purchaseOrder.total, status: purchaseOrder.status }
      });
    }

    return mobileSuccess(purchaseOrder, 'Purchase order created');
  } catch (error) {
    console.error('Mobile create purchase order error:', error);
    return mobileError('Failed to create purchase order', 500);
  }
}
