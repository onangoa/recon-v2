import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';

export async function GET(request: NextRequest) {
  const permCheck = await requirePermission(request, 'settings:read');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const userId = permCheck.userId!;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json(notifications);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const permCheck = await requirePermission(request, 'settings:update');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const { id, isRead } = await request.json();
    
    if (id === 'all') {
      const userId = permCheck.userId!;

      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      });
    } else {
      const userId = permCheck.userId!;
      const notification = await prisma.notification.findFirst({
        where: { id, userId }
      });
      if (!notification) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }
      await prisma.notification.update({
        where: { id },
        data: { isRead }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
