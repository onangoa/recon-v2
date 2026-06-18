import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { contractor: true }
    });

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    if (user.contractor) {
      await ActivityLogger.log({
        userId: user.id,
        contractorId: user.contractor.id,
        action: 'LOGIN',
        module: 'SETTINGS',
        description: `${user.name} logged in`,
      });
    }

    const { getPermissions } = await import('@/lib/rbac');
    const permissions = await getPermissions(user.id);

    let sites = [];
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
        }
      });
    }

    const response = NextResponse.json(
      {
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
      },
      { status: 200 }
    );

    response.cookies.set('sessionId', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
