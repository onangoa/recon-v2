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
  const permCheck = await mobileRequireContractorPermission(request, 'sites:read');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const contractorId = permCheck.contractorId!;
    const { id } = await params;
    const site = await prisma.site.findFirst({
      where: { id, contractorId },
    });

    if (!site) {
      return mobileError('Site not found', 404);
    }

    return mobileSuccess(site);
  } catch (error) {
    console.error('Failed to fetch site:', error);
    return mobileError('Failed to fetch site', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'sites:update');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const body = await request.json();
    const { id } = await params;

    const updatedSite = await prisma.$transaction(async (tx) => {
      const site = await tx.site.findFirst({
        where: { id, contractorId },
        select: { contractorId: true },
      });

      if (!site) {
        throw new Error('Site not found');
      }

      if (body.isPrimary) {
        await tx.site.updateMany({
          where: { contractorId: site.contractorId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      return await tx.site.update({
        where: { id },
        data: {
          name: body.name,
          location: body.location,
          description: body.description,
          category: body.category,
          isPrimary: body.isPrimary,
        },
      });
    });

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId,
      action: 'UPDATE',
      module: 'SITES',
      description: `Updated site: ${updatedSite.name}`,
      targetId: updatedSite.id,
    });

    return mobileSuccess(updatedSite, 'Site updated');
  } catch (error: any) {
    console.error('Failed to update site:', error);
    if (error.message === 'Site not found') {
      return mobileError('Site not found', 404);
    }
    return mobileError('Failed to update site', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'sites:delete');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const site = await prisma.site.findFirst({
      where: { id, contractorId },
      include: {
        _count: {
          select: {
            materials: true,
            tasks: true,
            equipment: true,
            visitors: true,
            documents: true,
            metrics: true,
          }
        }
      }
    });

    if (!site) {
      return mobileError('Site not found', 404);
    }

    const totalRelated =
      site._count.materials +
      site._count.tasks +
      site._count.equipment +
      site._count.visitors +
      site._count.documents +
      site._count.metrics;

    if (totalRelated > 0) {
      return mobileError('Cannot delete site with related records. Please remove all materials, tasks, and other associated data first.', 400);
    }

    await prisma.site.delete({
      where: { id },
    });

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId,
      action: 'DELETE',
      module: 'SITES',
      description: `Deleted site: ${site.name}`,
      targetId: site.id,
    });

    return mobileSuccess(null, 'Site deleted successfully');
  } catch (error) {
    console.error('Failed to delete site:', error);
    return mobileError('Failed to delete site', 500);
  }
}
