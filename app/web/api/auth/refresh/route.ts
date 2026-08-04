import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, isRefreshTokenValid, isRefreshTokenExpiredOrMissing, getLatestValidRefreshTokenForUser, generateAccessToken, generateRefreshToken, saveRefreshToken, revokeRefreshToken, revokeAllUserRefreshTokens } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { getPermissions } from '@/lib/rbac';
import { resolveContractorForUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value || 
      (await request.json().catch(() => ({})))?.refreshToken;

    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token provided' }, { status: 401 });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      const response = NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
      response.cookies.set('accessToken', '', { maxAge: 0, path: '/' });
      response.cookies.set('refreshToken', '', { maxAge: 0, path: '/' });
      return response;
    }

    const isValid = await isRefreshTokenValid(refreshToken);

    // Race-condition handling: the refresh token rotates on every refresh.
    // When two refresh requests fire concurrently (edge middleware + client
    // context timer, or multiple page/API requests on a stale access token),
    // the second request will find its token already revoked by the first.
    // Rather than killing all the user's sessions (which logs out an active
    // user), tolerate a revoked-but-recently-rotated token by continuing the
    // session from the user's latest valid refresh token. Only revoke all
    // sessions when the user genuinely has no remaining valid refresh token.
    let activeRefreshToken = refreshToken;
    if (!isValid) {
      const expiredOrMissing = await isRefreshTokenExpiredOrMissing(refreshToken);
      if (expiredOrMissing) {
        await revokeAllUserRefreshTokens(decoded.userId);
        const response = NextResponse.json({ error: 'Refresh token expired' }, { status: 401 });
        response.cookies.set('accessToken', '', { maxAge: 0, path: '/' });
        response.cookies.set('refreshToken', '', { maxAge: 0, path: '/' });
        return response;
      }

      const latest = await getLatestValidRefreshTokenForUser(decoded.userId);
      if (!latest) {
        await revokeAllUserRefreshTokens(decoded.userId);
        const response = NextResponse.json({ error: 'Refresh token revoked' }, { status: 401 });
        response.cookies.set('accessToken', '', { maxAge: 0, path: '/' });
        response.cookies.set('refreshToken', '', { maxAge: 0, path: '/' });
        return response;
      }
      activeRefreshToken = latest.token;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { contractor: true, teamMember: true },
    });

    if (!user) {
      const response = NextResponse.json({ error: 'User not found' }, { status: 401 });
      response.cookies.set('accessToken', '', { maxAge: 0, path: '/' });
      response.cookies.set('refreshToken', '', { maxAge: 0, path: '/' });
      return response;
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

    let sites: Array<{ id: string; name: string; location: string; status: string; isPrimary: boolean; projectId: string | null }> = [];
    if (contractor) {
      sites = await prisma.site.findMany({
        where: { contractorId: contractor.id },
        select: {
          id: true,
          name: true,
          location: true,
          status: true,
          isPrimary: true,
          projectId: true,
        },
      });
    }

    const needsOnboarding = contractor ? sites.length === 0 : false;

    const response = NextResponse.json({
      accessToken: newAccessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        avatar: user.avatar,
        permissions,
      },
      contractor: contractor ? {
        id: contractor.id,
        companyName: contractor.companyName,
        location: contractor.location,
        phoneNumber: contractor.phoneNumber,
        licenseNo: contractor.licenseNo,
        userId: contractor.userId,
      } : null,
      sites,
      selectedSiteId: sites.find(s => s.isPrimary)?.id || (sites.length > 0 ? sites[0].id : null),
      needsOnboarding,
    });

    response.cookies.set('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    });

    response.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Refresh token error:', error);
    const response = NextResponse.json({ error: 'Token refresh failed' }, { status: 500 });
    response.cookies.set('accessToken', '', { maxAge: 0, path: '/' });
    response.cookies.set('refreshToken', '', { maxAge: 0, path: '/' });
    return response;
  }
}