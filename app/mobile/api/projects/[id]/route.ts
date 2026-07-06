import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequirePermission(request, 'projects:read');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        contractor: true,
        sites: true,
        tasks: true,
        materials: true,
        equipment: true,
        documents: true,
        visitors: true,
        metrics: true,
      },
    });
    if (!project) {
      return mobileError('Project not found', 404);
    }
    return mobileSuccess(project);
  } catch (error) {
    return mobileError('Failed to fetch project', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequirePermission(request, 'projects:update');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const { id } = await params;
    const body = await request.json();
    const updateData: any = { ...body };
    if (body.startDate) updateData.startDate = new Date(body.startDate);
    if (body.endDate) updateData.endDate = new Date(body.endDate);

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        contractor: true,
      },
    });
    return mobileSuccess(project, 'Project updated');
  } catch (error) {
    return mobileError('Failed to update project', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequirePermission(request, 'projects:delete');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const { id } = await params;
    await prisma.project.delete({
      where: { id },
    });
    return mobileSuccess(null, 'Project deleted');
  } catch (error) {
    return mobileError('Failed to delete project', 500);
  }
}
