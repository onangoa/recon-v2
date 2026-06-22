import { NextRequest } from 'next/server';
import { mobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ error: true, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, needConfirm } = body;

  if (!id) return Response.json({ error: true, message: 'Notification id is required' }, { status: 400 });

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) return Response.json({ error: true, message: 'Notification not found' }, { status: 404 });

  const newReadStatus = needConfirm ? !notification.isRead : true;
  await prisma.notification.update({
    where: { id },
    data: { isRead: newReadStatus },
  });

  if (needConfirm) {
    const msg = newReadStatus ? 'Notification marked as read' : 'Notification marked as unread';
    return Response.json({ error: false, message: msg });
  }

  return Response.json({ error: false });
}