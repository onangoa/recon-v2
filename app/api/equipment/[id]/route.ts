import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: { site: true }
    });

    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    return NextResponse.json(equipment);
  } catch (error) {
    console.error('Failed to fetch equipment:', error);
    return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const equipment = await prisma.equipment.update({
      where: { id },
      data: {
        name: body.name,
        type: body.machineType || body.type || 'general',
        serialNo: body.serialNo || body.serialNumber || null,
        serialNumber: body.serialNumber || body.serialNo || null,
        rentalCost: body.rentalCost ? parseFloat(body.rentalCost) : null,
        dailyRate: body.dailyRate ? parseFloat(body.dailyRate) : null,
        status: body.status || 'Active',
        lastService: body.lastMaintenanceDate ? new Date(body.lastMaintenanceDate) : null,
        nextService: body.nextMaintenanceDate ? new Date(body.nextMaintenanceDate) : null,
        projectId: body.projectId || null,
      },
      include: { site: true }
    });

    await ActivityLogger.log({
      userId: 'system',
      contractorId: equipment.site.contractorId,
      action: 'UPDATE',
      module: 'EQUIPMENT',
      description: `Updated equipment: ${equipment.name}`,
      targetId: equipment.id,
      details: { name: equipment.name, type: equipment.type, status: equipment.status }
    });

    return NextResponse.json(equipment);
  } catch (error) {
    console.error('Failed to update equipment:', error);
    return NextResponse.json({ error: 'Failed to update equipment' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: { site: true }
    });

    if (equipment) {
      await ActivityLogger.log({
        userId: 'system',
        contractorId: equipment.site.contractorId,
        action: 'DELETE',
        module: 'EQUIPMENT',
        description: `Deleted equipment: ${equipment.name}`,
        targetId: equipment.id,
        details: { name: equipment.name, type: equipment.type, serialNo: equipment.serialNo }
      });
    }

    await prisma.equipment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete equipment:', error);
    return NextResponse.json({ error: 'Failed to delete equipment' }, { status: 500 });
  }
}
