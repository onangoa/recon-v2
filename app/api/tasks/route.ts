import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { requirePermission } from '@/lib/require-permission';

export async function GET(request: NextRequest) {
  const permCheck = await requirePermission(request, 'tasks:read');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    
    const where: any = {};
    if (siteId) {
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
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const permCheck = await requirePermission(request, 'tasks:create');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const body = await request.json();
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
      userId: 'system',
      contractorId: task.site.contractorId,
      action: 'CREATE',
      module: 'INVENTORY',
      description: `Created task: ${task.title}`,
      targetId: task.id,
      details: { title: task.title, status: task.status, priority: task.priority }
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Failed to create task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
