import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { getPermissions } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const payload = verifyAccessToken(accessToken);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { contractor: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
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

    return NextResponse.json({
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
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 });
  }
}