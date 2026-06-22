import { NextRequest } from 'next/server';
import { mobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ error: true, message: 'Unauthorized' }, { status: 401 });
  }

  if (!auth.userId) {
    return Response.json({ error: true, message: 'Unauthorized' }, { status: 401 });
  }

  await prisma.notification.updateMany({
    where: { userId: auth.userId, isRead: false },
    data: { isRead: true },
  });

  return Response.json({ error: false, message: 'All notifications marked as read' });
}