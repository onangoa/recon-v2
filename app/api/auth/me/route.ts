import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('sessionId')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          include: { contractor: true }
        }
      }
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: sessionId } });
      }
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    const { getPermissions } = await import('@/lib/rbac');
    const permissions = await getPermissions(session.user.id);

    let sites = [];
    if (session.user.contractor) {
      sites = await prisma.site.findMany({
        where: { contractorId: session.user.contractor.id },
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

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        name: session.user.name,
        avatar: session.user.avatar,
        permissions,
      },
      contractor: session.user.contractor ? {
        id: session.user.contractor.id,
        companyName: session.user.contractor.companyName,
        location: session.user.contractor.location,
        phoneNumber: session.user.contractor.phoneNumber,
        licenseNo: session.user.contractor.licenseNo,
        userId: session.user.contractor.userId,
      } : null,
      sites,
      selectedSiteId: localStorage.getItem('selectedSiteId') || sites.find(s => s.isPrimary)?.id || (sites.length > 0 ? sites[0].id : null),
    });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}