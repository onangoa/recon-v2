import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitor = await prisma.visitor.findUnique({
      where: { id },
      include: { site: true }
    });

    if (!visitor) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    return NextResponse.json(visitor);
  } catch (error) {
    console.error('Failed to fetch visitor:', error);
    return NextResponse.json({ error: 'Failed to fetch visitor' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const visitor = await prisma.visitor.update({
      where: { id },
      data: {
        name: body.name,
        company: body.company || null,
        purpose: body.purpose,
        checkOutTime: body.checkOutTime ? new Date(body.checkOutTime) : null,
        projectId: body.projectId || null,
      },
      include: { site: true }
    });

    await ActivityLogger.log({
      userId: 'system',
      contractorId: visitor.site.contractorId,
      action: 'UPDATE',
      module: 'VISITORS',
      description: `Updated visitor: ${visitor.name}`,
      targetId: visitor.id,
      details: { name: visitor.name, checkOutTime: visitor.checkOutTime }
    });

    return NextResponse.json(visitor);
  } catch (error) {
    console.error('Failed to update visitor:', error);
    return NextResponse.json({ error: 'Failed to update visitor' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visitor = await prisma.visitor.findUnique({
      where: { id },
      include: { site: true }
    });

    if (visitor && visitor.site) {
      await ActivityLogger.log({
        userId: 'system',
        contractorId: visitor.site.contractorId,
        action: 'DELETE',
        module: 'VISITORS',
        description: `Deleted visitor: ${visitor.name}`,
        targetId: visitor.id,
        details: { name: visitor.name, company: visitor.company }
      });
    }

    await prisma.visitor.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete visitor:', error);
    return NextResponse.json({ error: 'Failed to delete visitor' }, { status: 500 });
  }
}