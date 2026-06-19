import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';
import { revokeAllUserRefreshTokens } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  await revokeAllUserRefreshTokens(auth.userId!);

  return mobileSuccess(null, 'Logged out successfully');
}