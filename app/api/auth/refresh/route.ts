import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, isRefreshTokenValid, generateAccessToken, generateRefreshToken, saveRefreshToken, revokeRefreshToken, revokeAllUserRefreshTokens } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { getPermissions } from '@/lib/rbac';

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
    if (!isValid) {
      await revokeAllUserRefreshTokens(decoded.userId);
      const response = NextResponse.json({ error: 'Refresh token revoked or expired' }, { status: 401 });
      response.cookies.set('accessToken', '', { maxAge: 0, path: '/' });
      response.cookies.set('refreshToken', '', { maxAge: 0, path: '/' });
      return response;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { contractor: true },
    });

    if (!user) {
      const response = NextResponse.json({ error: 'User not found' }, { status: 401 });
      response.cookies.set('accessToken', '', { maxAge: 0, path: '/' });
      response.cookies.set('refreshToken', '', { maxAge: 0, path: '/' });
      return response;
    }

    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      contractorId: user.contractor?.id || null,
    });

    const newRefreshToken = generateRefreshToken(user.id);

    await revokeRefreshToken(refreshToken);
    await saveRefreshToken(user.id, newRefreshToken);

    const permissions = await getPermissions(user.id);

    let sites: Array<{ id: string; name: string; location: string; status: string; isPrimary: boolean; projectId: string | null }> = [];
    if (user.contractor) {
      sites = await prisma.site.findMany({
        where: { contractorId: user.contractor.id },
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

    const needsOnboarding = user.contractor ? sites.length === 0 : false;

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
      contractor: user.contractor ? {
        id: user.contractor.id,
        companyName: user.contractor.companyName,
        location: user.contractor.location,
        phoneNumber: user.contractor.phoneNumber,
        licenseNo: user.contractor.licenseNo,
        userId: user.contractor.userId,
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