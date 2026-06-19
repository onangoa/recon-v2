import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  if (!auth.userId) return mobileError('User not found', 404);

  await prisma.notification.updateMany({
    where: { userId: auth.userId, isRead: false },
    data: { isRead: true },
  });

  return mobileSuccess(null, 'All notifications marked as read');
}