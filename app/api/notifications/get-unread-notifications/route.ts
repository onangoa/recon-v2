import { NextRequest } from 'next/server';
import { mobileAuth, mobileCountData } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ count: 0, data: [] });
  }

  const userId = request.nextUrl.searchParams.get('user_id') || auth.userId;

  const notifications = await prisma.notification.findMany({
    where: { userId, isRead: false },
    orderBy: { createdAt: 'desc' },
  });

  return mobileCountData(notifications.length, notifications.map(n => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    type_id: n.id,
    created_at: n.createdAt?.toISOString() ?? null,
  })));
}