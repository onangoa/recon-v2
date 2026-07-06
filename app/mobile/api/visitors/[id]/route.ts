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
  const permCheck = await mobileRequireContractorPermission(request, 'visitors:read');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const contractorId = permCheck.contractorId!;
    const { id } = await params;
    const visitor = await prisma.visitor.findFirst({
      where: { id, site: { contractorId } },
      include: { site: true }
    });

    if (!visitor) {
      return mobileError('Visitor not found', 404);
    }

    return mobileSuccess(visitor);
  } catch (error) {
    console.error('Failed to fetch visitor:', error);
    return mobileError('Failed to fetch visitor', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'visitors:update');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.visitor.findFirst({
      where: { id, site: { contractorId } },
      select: { id: true }
    });
    if (!existing) {
      return mobileError('Visitor not found', 404);
    }

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
      userId: permCheck.userId || 'system',
      contractorId: visitor.site.contractorId,
      action: 'UPDATE',
      module: 'VISITORS',
      description: `Updated visitor: ${visitor.name}`,
      targetId: visitor.id,
      details: { name: visitor.name, checkOutTime: visitor.checkOutTime }
    });

    return mobileSuccess(visitor, 'Visitor updated');
  } catch (error) {
    console.error('Failed to update visitor:', error);
    return mobileError('Failed to update visitor', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'visitors:delete');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const visitor = await prisma.visitor.findFirst({
      where: { id, site: { contractorId } },
      include: { site: true }
    });

    if (!visitor) {
      return mobileError('Visitor not found', 404);
    }

    if (visitor.site) {
      await ActivityLogger.log({
        userId: permCheck.userId || 'system',
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

    return mobileSuccess(null, 'Visitor deleted');
  } catch (error) {
    console.error('Failed to delete visitor:', error);
    return mobileError('Failed to delete visitor', 500);
  }
}
