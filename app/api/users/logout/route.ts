import { NextRequest } from 'next/server';
import { mobileAuth, mobileError } from '@/lib/mobile-auth';
import { revokeAllUserRefreshTokens } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  await revokeAllUserRefreshTokens(auth.userId!);

  return Response.json({ success: true, message: 'Logged out successfully' });
}