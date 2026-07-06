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
    const permCheck = await mobileRequireContractorPermission(request, 'equipment:read');
    if (!permCheck.authorized) return permCheck.error!;

    const contractorId = permCheck.contractorId!;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
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

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { type: { contains: search } },
        { serialNumber: { contains: search } },
      ];
    }

    const [equipment, total] = await Promise.all([
      prisma.equipment.findMany({
        where,
        orderBy: {
          name: 'asc'
        },
        skip,
        take: limit,
      }),
      prisma.equipment.count({ where })
    ]);

    return mobileList(equipment, total, {
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Mobile fetch equipment error:', error);
    return mobileError('Failed to fetch equipment', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const permCheck = await mobileRequireContractorPermission(request, 'equipment:create');
    if (!permCheck.authorized) return permCheck.error!;

    const contractorId = permCheck.contractorId!;
    const body = await request.json();

    if (!body.siteId) {
      return mobileError('Site ID is required', 400);
    }

    const owns = await verifySiteOwnership(contractorId, body.siteId);
    if (!owns) {
      return mobileError('Site not found', 404);
    }

    if (!body.name) {
      return mobileError('Name is required', 400);
    }

    if (!body.machineType) {
      return mobileError('Machine type is required', 400);
    }

    const equipment = await prisma.equipment.create({
      data: {
        site: {
          connect: { id: body.siteId }
        },
        name: body.name,
        type: body.machineType || body.type || 'general',
        serialNo: body.serialNo || null,
        serialNumber: body.serialNumber || null,
        rentalCost: body.rentalCost ? parseFloat(body.rentalCost) : null,
        dailyRate: body.dailyRate ? parseFloat(body.dailyRate) : null,
        status: body.status || 'Active',
        lastService: body.lastMaintenanceDate ? new Date(body.lastMaintenanceDate) : null,
        nextService: body.nextMaintenanceDate ? new Date(body.nextMaintenanceDate) : null,
        projectId: body.projectId || null,
      },
    });

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId,
      action: 'CREATE',
      module: 'EQUIPMENT',
      description: `Added equipment: ${equipment.name}`,
      targetId: equipment.id,
      details: { name: equipment.name, type: equipment.type, serialNumber: equipment.serialNumber, status: equipment.status }
    });

    return mobileSuccess(equipment, 'Equipment created');
  } catch (error) {
    console.error('Mobile create equipment error:', error);
    return mobileError('Failed to create equipment', 500);
  }
}
