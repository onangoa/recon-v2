import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { generateAccessToken, generateRefreshToken, hashPassword, comparePassword, saveRefreshToken } from '@/lib/jwt';
import { getPermissions } from '@/lib/rbac';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { contractor: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      contractorId: user.contractor?.id || null,
    });

    const refreshToken = generateRefreshToken(user.id);
    await saveRefreshToken(user.id, refreshToken);

    if (user.contractor) {
      try {
        await ActivityLogger.log({
          userId: user.id,
          contractorId: user.contractor.id,
          action: 'LOGIN',
          module: 'SETTINGS',
          description: `${user.name} logged in`,
        });
      } catch (e) {
        console.error('Activity log error:', e);
      }
    }

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
      message: 'Login successful',
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
    }, { status: 200 });

    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}