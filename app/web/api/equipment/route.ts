import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { requirePermission } from '@/lib/require-permission';

export async function GET(request: Request) {
  const permCheck = await requirePermission(request, 'equipment:read');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const siteId = searchParams.get('siteId');
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (siteId) {
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

    return NextResponse.json({
      equipment,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Failed to fetch equipment:', error);
    return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const permCheck = await requirePermission(request, 'equipment:create');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const body = await request.json();
    
    if (!body.siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }
    
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!body.machineType) {
      return NextResponse.json({ error: 'Machine type is required' }, { status: 400 });
    }

    const site = await prisma.site.findUnique({
      where: { id: body.siteId }
    });

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

    if (site) {
      await ActivityLogger.log({
        userId: 'system',
        contractorId: site.contractorId,
        action: 'CREATE',
        module: 'EQUIPMENT',
        description: `Added equipment: ${equipment.name}`,
        targetId: equipment.id,
        details: { name: equipment.name, type: equipment.type, serialNumber: equipment.serialNumber, status: equipment.status }
      });
    }

    return NextResponse.json(equipment);
  } catch (error) {
    console.error('Failed to create equipment:', error);
    return NextResponse.json({ error: 'Failed to create equipment' }, { status: 500 });
  }
}