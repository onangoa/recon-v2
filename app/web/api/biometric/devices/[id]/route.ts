import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { requireContractorPermission } from '@/lib/require-permission';
import { checkDeviceStatus } from '@/lib/biometric-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireContractorPermission(request, 'settings:update');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.biometricDevice.findFirst({
      where: { id, contractorId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    const sn = body.sn !== undefined ? String(body.sn).trim() : existing.sn;
    if (body.sn !== undefined && sn !== existing.sn) {
      const dup = await prisma.biometricDevice.findUnique({
        where: { contractorId_sn: { contractorId, sn } },
      });
      if (dup) {
        return NextResponse.json({ error: 'A device with this serial number already exists' }, { status: 409 });
      }
    }

    const updated = await prisma.biometricDevice.update({
      where: { id },
      data: {
        name: body.name !== undefined ? String(body.name).trim() : undefined,
        sn: body.sn !== undefined ? sn : undefined,
        location: body.location !== undefined ? (body.location ? String(body.location) : null) : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
      },
    });

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId,
      action: 'UPDATE',
      module: 'SETTINGS',
      description: `Updated biometric device "${updated.name}" (sn: ${updated.sn})`,
      targetId: updated.id,
      details: { name: updated.name, sn: updated.sn },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update biometric device:', error);
    return NextResponse.json({ error: 'Failed to update biometric device' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireContractorPermission(request, 'settings:update');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;

  try {
    const { id } = await params;
    const existing = await prisma.biometricDevice.findFirst({
      where: { id, contractorId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    await prisma.biometricDevice.delete({ where: { id } });

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId,
      action: 'DELETE',
      module: 'SETTINGS',
      description: `Deleted biometric device "${existing.name}" (sn: ${existing.sn})`,
      targetId: existing.id,
    });

    return NextResponse.json({ message: 'Device deleted' });
  } catch (error) {
    console.error('Failed to delete biometric device:', error);
    return NextResponse.json({ error: 'Failed to delete biometric device' }, { status: 500 });
  }
}