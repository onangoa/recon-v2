import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import {
  mobileRequireContractorPermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';
import { verifySiteOwnership } from '@/lib/contractor-isolation';

export async function GET(request: NextRequest) {
  const permCheck = await mobileRequireContractorPermission(request, 'tasks:read');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const contractorId = permCheck.contractorId!;
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    const where: any = { site: { contractorId } };
    if (siteId) {
      const owns = await verifySiteOwnership(contractorId, siteId);
      if (!owns) {
        return mobileError('Site not found', 404);
      }
      where.siteId = siteId;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        site: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return mobileSuccess(tasks);
  } catch (error) {
    return mobileError('Failed to fetch tasks', 500);
  }
}

export async function POST(request: NextRequest) {
  const permCheck = await mobileRequireContractorPermission(request, 'tasks:create');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;
  try {
    const body = await request.json();

    if (!body.siteId) {
      return mobileError('Site ID is required', 400);
    }

    const owns = await verifySiteOwnership(contractorId, body.siteId);
    if (!owns) {
      return mobileError('Site not found', 404);
    }

    const task = await prisma.task.create({
      data: {
        site: {
          connect: { id: body.siteId }
        },
        title: body.title,
        description: body.description,
        status: body.status || 'pending',
        priority: body.priority || 'medium',
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      },
      include: {
        site: true,
      },
    });

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId,
      action: 'CREATE',
      module: 'INVENTORY',
      description: `Created task: ${task.title}`,
      targetId: task.id,
      details: { title: task.title, status: task.status, priority: task.priority }
    });

    return mobileSuccess(task, 'Task created');
  } catch (error) {
    console.error('Failed to create task:', error);
    return mobileError('Failed to create task', 500);
  }
}
