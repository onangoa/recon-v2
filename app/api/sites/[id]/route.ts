import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const site = await prisma.site.findUnique({
      where: { id },
    });

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    return NextResponse.json(site);
  } catch (error) {
    console.error('Failed to fetch site:', error);
    return NextResponse.json({ error: 'Failed to fetch site' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;
    
    const updatedSite = await prisma.$transaction(async (tx) => {
      const site = await tx.site.findUnique({
        where: { id },
        select: { contractorId: true },
      });

      if (!site) {
        throw new Error('Site not found');
      }

      // If this site is being set as primary, unset any other primary sites for this contractor
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
          isPrimary: body.isPrimary,
        },
      });
    });

    // Record activity log
    await ActivityLogger.log({
      userId: 'system', 
      contractorId: updatedSite.contractorId,
      action: 'UPDATE',
      module: 'SITES',
      description: `Updated site: ${updatedSite.name}`,
      targetId: updatedSite.id,
    });

    return NextResponse.json(updatedSite);
  } catch (error: any) {
    console.error('Failed to update site:', error);
    if (error.message === 'Site not found') {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update site' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check for related records
    const site = await prisma.site.findUnique({
      where: { id },
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
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const totalRelated = 
      site._count.materials + 
      site._count.tasks + 
      site._count.equipment + 
      site._count.visitors + 
      site._count.documents + 
      site._count.metrics;

    if (totalRelated > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete site with related records. Please remove all materials, tasks, and other associated data first.' 
      }, { status: 400 });
    }

    await prisma.site.delete({
      where: { id },
    });

    // Record activity log
    await ActivityLogger.log({
      userId: 'system', 
      contractorId: site.contractorId,
      action: 'DELETE',
      module: 'SITES',
      description: `Deleted site: ${site.name}`,
      targetId: site.id,
    });

    return NextResponse.json({ message: 'Site deleted successfully' });
  } catch (error) {
    console.error('Failed to delete site:', error);
    return NextResponse.json({ error: 'Failed to delete site' }, { status: 500 });
  }
}
