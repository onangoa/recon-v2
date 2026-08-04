import { NextRequest } from 'next/server';
import {
  verifyRefreshToken,
  isRefreshTokenValid,
  isRefreshTokenExpiredOrMissing,
  getLatestValidRefreshTokenForUser,
  generateAccessToken,
  generateRefreshToken,
  saveRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
} from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { getPermissions } from '@/lib/rbac';
import { resolveContractorForUser } from '@/lib/auth';
import { mobileSuccess, mobileError } from '@/lib/mobile-auth';

export async function POST(request: NextRequest) {
  try {
    let refreshToken: string | undefined;

    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      refreshToken = authHeader.substring(7);
    }

    if (!refreshToken) {
      const body = await request.json().catch(() => ({}));
      refreshToken = body?.refreshToken;
    }

    if (!refreshToken) {
      return mobileError('No refresh token provided', 401);
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return mobileError('Invalid refresh token', 401);
    }

    const isValid = await isRefreshTokenValid(refreshToken);

    // Tolerate race-condition rotations: if this token was already rotated by
    // a concurrent refresh (revoked-but-not-expired), continue the session from
    // the user's latest valid refresh token instead of killing all sessions.
    let activeRefreshToken = refreshToken;
    if (!isValid) {
      const expiredOrMissing = await isRefreshTokenExpiredOrMissing(refreshToken);
      if (expiredOrMissing) {
        await revokeAllUserRefreshTokens(decoded.userId);
        return mobileError('Refresh token expired', 401);
      }

      const latest = await getLatestValidRefreshTokenForUser(decoded.userId);
      if (!latest) {
        await revokeAllUserRefreshTokens(decoded.userId);
        return mobileError('Refresh token revoked', 401);
      }
      activeRefreshToken = latest.token;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { contractor: true, teamMember: true },
    });

    if (!user) {
      return mobileError('User not found', 401);
    }

    const contractor = await resolveContractorForUser(user.id);

    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      contractorId: contractor?.id || null,
    });

    const newRefreshToken = generateRefreshToken(user.id);

    await revokeRefreshToken(activeRefreshToken);
    await saveRefreshToken(user.id, newRefreshToken);

    const permissions = await getPermissions(user.id);

    return mobileSuccess(
      {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        tokenType: 'Bearer',
        expiresIn: 15 * 60,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          avatar: user.avatar,
          permissions,
        },
      },
      'Token refreshed'
    );
  } catch (error) {
    console.error('Mobile refresh error:', error);
    return mobileError('Token refresh failed', 500);
  }
}
