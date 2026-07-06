import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { verifyAccessToken, revokeAllUserRefreshTokens } from '@/lib/jwt';
import { mobileAuth, mobileSuccess, mobileError } from '@/lib/mobile-auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await mobileAuth(request);
    if (auth.authenticated && auth.userId) {
      const user = await prisma.user.findUnique({
        where: { id: auth.userId },
        include: { contractor: true },
      });

      if (user?.contractor) {
        try {
          await ActivityLogger.log({
            userId: user.id,
            contractorId: user.contractor.id,
            action: 'LOGOUT',
            module: 'SETTINGS',
            description: `${user.name} logged out (mobile)`,
          });
        } catch (e) {
          console.error('Activity log error:', e);
        }
      }

      await revokeAllUserRefreshTokens(auth.userId);
    }

    return mobileSuccess(null, 'Logout successful');
  } catch (error) {
    console.error('Mobile logout error:', error);
    return mobileSuccess(null, 'Logout successful');
  }
}
