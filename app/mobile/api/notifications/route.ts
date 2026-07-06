import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  const permCheck = await mobileRequirePermission(request, 'settings:read');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const userId = permCheck.userId!;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return mobileSuccess(notifications);
  } catch (error) {
    return mobileError('Failed to fetch notifications', 500);
  }
}

export async function PUT(request: NextRequest) {
  const permCheck = await mobileRequirePermission(request, 'settings:update');
  if (!permCheck.authorized) return permCheck.error!;
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
        return mobileError('Notification not found', 404);
      }
      await prisma.notification.update({
        where: { id },
        data: { isRead }
      });
    }

    return mobileSuccess(null, 'Notification updated');
  } catch (error) {
    return mobileError('Failed to update notification', 500);
  }
}
