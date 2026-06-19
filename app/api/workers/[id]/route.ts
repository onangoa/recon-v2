import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const worker = await prisma.worker.findUnique({
      where: { id },
      include: {
        designation: true,
        shift: true,
      },
    });
    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }
    return NextResponse.json(worker);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch worker' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const worker = await prisma.worker.findUnique({
      where: { id },
      select: { contractorId: true }
    });

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    let designationId = body.designationId;
    if (designationId === "" || designationId === "null" || designationId === "undefined") {
      designationId = null;
    }

    let shiftId = body.shiftId;
    if (shiftId === "" || shiftId === "null" || shiftId === "undefined") {
      shiftId = null;
    }

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

    if (shiftId) {
      const shift = await prisma.shift.findFirst({
        where: {
          id: shiftId,
          contractorId: worker.contractorId
        }
      });
      if (!shift) {
        return NextResponse.json({ error: 'Invalid shift ID' }, { status: 400 });
      }
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
        shiftId,
        paymentMode: body.paymentMode,
        paymentPhone: body.paymentPhone !== undefined ? body.paymentPhone : undefined,
        paymentAccount: body.paymentAccount !== undefined ? body.paymentAccount : undefined,
        status: body.status,
        joinedAt: body.joinedAt ? new Date(body.joinedAt) : undefined,
      },
      include: {
        designation: true,
        shift: true,
      },
    });

    await ActivityLogger.log({
      userId: 'system',
      contractorId: worker.contractorId,
      action: 'UPDATE',
      module: 'WORKERS',
      description: `Updated worker details: ${updatedWorker.name}`,
      targetId: updatedWorker.id,
      details: { name: updatedWorker.name, status: updatedWorker.status }
    });

    return NextResponse.json(updatedWorker);
  } catch (error) {
    console.error('Failed to update worker:', error);
    return NextResponse.json({ error: 'Failed to update worker' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const worker = await prisma.worker.delete({
      where: { id },
    });

    // Record activity log
    await ActivityLogger.log({
      userId: 'system', 
      contractorId: worker.contractorId,
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
