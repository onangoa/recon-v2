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

    // Handle empty or invalid designationId
    let designationId = body.designationId;
    if (designationId === "" || designationId === "null" || designationId === "undefined") {
      designationId = null;
    }

    const worker = await prisma.worker.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        nationalId: body.nationalId,
        designationId: designationId,
        status: body.status,
        joinedAt: body.joinedAt ? new Date(body.joinedAt) : undefined,
      },
      include: {
        designation: true,
      },
    });

    // Record activity log
    await ActivityLogger.log({
      userId: 'system', 
      contractorId: worker.contractorId,
      action: 'UPDATE',
      module: 'WORKERS',
      description: `Updated worker details: ${worker.name}`,
      targetId: worker.id,
      details: { name: worker.name, status: worker.status }
    });

    return NextResponse.json(worker);
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
