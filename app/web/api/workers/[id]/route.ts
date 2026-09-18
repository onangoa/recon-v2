import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { requireContractorPermission } from '@/lib/require-permission';
import {
  normalizeShiftIdsInput,
  syncWorkerShiftAssignments,
  validateShiftOwnership,
  withShiftsArray,
  workerShiftInclude,
} from '@/lib/worker-shifts';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireContractorPermission(request, 'workers:read');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const contractorId = permCheck.contractorId!;
    const { id } = await params;
    const worker = await prisma.worker.findFirst({
      where: { id, contractorId },
      include: {
        designation: true,
        shift: true,
        ...workerShiftInclude,
      },
    });
    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }
    return NextResponse.json(withShiftsArray(worker));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch worker' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireContractorPermission(request, 'workers:update');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const body = await request.json();

    const worker = await prisma.worker.findFirst({
      where: { id, contractorId },
      select: { contractorId: true }
    });

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    let designationId = body.designationId;
    if (designationId === "" || designationId === "null" || designationId === "undefined") {
      designationId = null;
    }

    // Multi-shift assignment: `shiftIds` array, or the legacy single
    // `shiftId`. Undefined (neither key present) leaves assignments as-is.
    const shiftIds = normalizeShiftIdsInput(body);

    if (designationId) {
      const designation = await prisma.designation.findFirst({
        where: {
          id: designationId,
          contractorId: worker.contractorId
        }
      });
      if (!designation) {
        return NextResponse.json({ error: 'Invalid designation ID' }, { status: 400 });
      }
    }

    if (shiftIds) {
      const ownedShiftIds = await validateShiftOwnership(shiftIds, worker.contractorId);
      if (ownedShiftIds === null) {
        return NextResponse.json({ error: 'Invalid shift ID' }, { status: 400 });
      }
    }

    if (shiftIds) {
      // Sync join rows (and the mirrored primary shift) before the update
      // so the returned worker reflects the new assignments.
      await syncWorkerShiftAssignments(id, shiftIds);
    }

    const updatedWorker = await prisma.worker.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        nationalId: body.nationalId,
        enrollId: body.enrollId !== undefined ? body.enrollId : undefined,
        designationId,
        shiftId: shiftIds ? (shiftIds[0] || null) : undefined,
        paymentMode: body.paymentMode,
        paymentPhone: body.paymentPhone !== undefined ? body.paymentPhone : undefined,
        paymentAccount: body.paymentAccount !== undefined ? body.paymentAccount : undefined,
        status: body.status,
        joinedAt: body.joinedAt ? new Date(body.joinedAt) : undefined,
        idDocumentUrl: body.idDocumentUrl !== undefined ? (body.idDocumentUrl || null) : undefined,
      },
      include: {
        designation: true,
        shift: true,
        ...workerShiftInclude,
      },
    });

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId,
      action: 'UPDATE',
      module: 'WORKERS',
      description: `Updated worker details: ${updatedWorker.name}`,
      targetId: updatedWorker.id,
      details: { name: updatedWorker.name, status: updatedWorker.status }
    });

    return NextResponse.json(withShiftsArray(updatedWorker));
  } catch (error) {
    console.error('Failed to update worker:', error);
    return NextResponse.json({ error: 'Failed to update worker' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requireContractorPermission(request, 'workers:delete');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const worker = await prisma.worker.findFirst({
      where: { id, contractorId },
    });

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    await prisma.worker.delete({ where: { id } });

    // Record activity log
    await ActivityLogger.log({
      userId: permCheck.userId || 'system', 
      contractorId,
      action: 'DELETE',
      module: 'WORKERS',
      description: `Deleted worker: ${worker.name}`,
      targetId: worker.id,
    });

    return NextResponse.json({ message: 'Worker deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete worker' }, { status: 500 });
  }
}
