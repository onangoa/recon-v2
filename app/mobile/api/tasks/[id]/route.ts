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
  const permCheck = await mobileRequireContractorPermission(request, 'tasks:read');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const contractorId = permCheck.contractorId!;
    const { id } = await params;
    const task = await prisma.task.findFirst({
      where: { id, site: { contractorId } },
      include: {
        project: true,
        site: true,
      },
    });
    if (!task) {
      return mobileError('Task not found', 404);
    }
    return mobileSuccess(task);
  } catch (error) {
    return mobileError('Failed to fetch task', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'tasks:update');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.task.findFirst({
      where: { id, site: { contractorId } },
      select: { id: true }
    });
    if (!existing) {
      return mobileError('Task not found', 404);
    }

    const updateData: any = { ...body };
    if (body.dueDate) updateData.dueDate = new Date(body.dueDate);

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: true,
        site: true,
      },
    });

    if (task.site) {
      await ActivityLogger.log({
        userId: permCheck.userId || 'system',
        contractorId: task.site.contractorId,
        action: 'UPDATE',
        module: 'INVENTORY',
        description: `Updated task: ${task.title}`,
        targetId: task.id,
        details: { title: task.title, status: task.status, priority: task.priority }
      });
    }

    return mobileSuccess(task, 'Task updated');
  } catch (error) {
    return mobileError('Failed to update task', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireContractorPermission(request, 'tasks:delete');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const { id } = await params;
    const task = await prisma.task.findFirst({
      where: { id, site: { contractorId } },
      include: { site: true }
    });

    if (!task) {
      return mobileError('Task not found', 404);
    }

    if (task.site) {
      await ActivityLogger.log({
        userId: permCheck.userId || 'system',
        contractorId: task.site.contractorId,
        action: 'DELETE',
        module: 'INVENTORY',
        description: `Deleted task: ${task.title}`,
        targetId: task.id,
        details: { title: task.title, status: task.status }
      });
    }

    await prisma.task.delete({
      where: { id },
    });
    return mobileSuccess(null, 'Task deleted');
  } catch (error) {
    return mobileError('Failed to delete task', 500);
  }
}
