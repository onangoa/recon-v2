import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const body = await request.json();
  const { id, needConfirm } = body;

  if (!id) return mobileError('Notification id is required', 400);

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) return mobileError('Notification not found', 404);

  await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  return mobileSuccess({
    id: notification.id,
    is_read: true,
  }, 'Notification updated successfully');
}