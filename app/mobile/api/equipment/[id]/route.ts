import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import {
  mobileRequireContractorPermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'equipment:read');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const equipment = await prisma.equipment.findFirst({
      where: { id, site: { contractorId } },
      include: { site: true }
    });

    if (!equipment) {
      return mobileError('Equipment not found', 404);
    }

    return mobileSuccess(equipment);
  } catch (error) {
    console.error('Mobile fetch equipment error:', error);
    return mobileError('Failed to fetch equipment', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'equipment:update');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.equipment.findFirst({
      where: { id, site: { contractorId } },
      select: { id: true }
    });
    if (!existing) {
      return mobileError('Equipment not found', 404);
    }

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
      userId: permCheck.userId || 'system',
      contractorId: equipment.site.contractorId,
      action: 'UPDATE',
      module: 'EQUIPMENT',
      description: `Updated equipment: ${equipment.name}`,
      targetId: equipment.id,
      details: { name: equipment.name, type: equipment.type, status: equipment.status }
    });

    return mobileSuccess(equipment, 'Equipment updated');
  } catch (error) {
    console.error('Mobile update equipment error:', error);
    return mobileError('Failed to update equipment', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'equipment:delete');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const equipment = await prisma.equipment.findFirst({
      where: { id, site: { contractorId } },
      include: { site: true }
    });

    if (!equipment) {
      return mobileError('Equipment not found', 404);
    }

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId: equipment.site.contractorId,
      action: 'DELETE',
      module: 'EQUIPMENT',
      description: `Deleted equipment: ${equipment.name}`,
      targetId: equipment.id,
      details: { name: equipment.name, type: equipment.type, serialNo: equipment.serialNo }
    });

    await prisma.equipment.delete({
      where: { id },
    });

    return mobileSuccess(null, 'Equipment deleted');
  } catch (error) {
    console.error('Mobile delete equipment error:', error);
    return mobileError('Failed to delete equipment', 500);
  }
}
