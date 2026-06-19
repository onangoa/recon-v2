import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  if (!auth.userId) return mobileError('User not found', 404);

  await prisma.user.delete({ where: { id: auth.userId } });

  return mobileSuccess(null, 'Account deleted successfully');
}