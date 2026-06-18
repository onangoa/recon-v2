import { NextRequest, NextResponse } from 'next/server';
import { revokeAllUserRefreshTokens } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { verifyAccessToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (accessToken) {
      const payload = verifyAccessToken(accessToken);
      if (payload?.userId) {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          include: { contractor: true },
        });

        if (user?.contractor) {
          try {
            await ActivityLogger.log({
              userId: user.id,
              contractorId: user.contractor.id,
              action: 'LOGOUT',
              module: 'SETTINGS',
              description: `${user.name} logged out`,
            });
          } catch (e) {
            console.error('Activity log error:', e);
          }
        }

        await revokeAllUserRefreshTokens(payload.userId);
      }
    }

    if (refreshToken) {
      try {
        await revokeAllUserRefreshTokens(
          (verifyAccessToken(refreshToken) || {} as any)?.userId || ''
        );
      } catch {}
    }

    const response = NextResponse.json({ message: 'Logout successful' });

    response.cookies.set('accessToken', '', {
      maxAge: 0,
      path: '/',
    });

    response.cookies.set('refreshToken', '', {
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);

    const response = NextResponse.json({ message: 'Logout successful' });
    response.cookies.set('accessToken', '', { maxAge: 0, path: '/' });
    response.cookies.set('refreshToken', '', { maxAge: 0, path: '/' });
    return response;
  }
}