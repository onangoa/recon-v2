import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPermissions } from '@/lib/rbac';
import { resolveContractorForUser } from '@/lib/auth';
import { mobileAuth, mobileSuccess, mobileError } from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await mobileAuth(request);
    if (!auth.authenticated || !auth.userId) {
      return mobileError('Unauthenticated.', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      include: { contractor: true, teamMember: true },
    });

    if (!user) {
      return mobileError('User not found', 401);
    }

    const contractor = await resolveContractorForUser(user.id);
    const permissions = await getPermissions(user.id);

    let sites: Array<{
      id: string;
      name: string;
      location: string;
      status: string;
      isPrimary: boolean;
      projectId: string | null;
    }> = [];
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

    return mobileSuccess(
      {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          avatar: user.avatar,
          phone: user.teamMember?.phone || user.contractor?.phoneNumber || null,
          permissions,
        },
        contractor: contractor
          ? {
              id: contractor.id,
              companyName: contractor.companyName,
              location: contractor.location,
              phoneNumber: contractor.phoneNumber,
              licenseNo: contractor.licenseNo,
              userId: contractor.userId,
            }
          : null,
        sites,
        selectedSiteId: auth.siteId || sites.find((s) => s.isPrimary)?.id || (sites.length > 0 ? sites[0].id : null),
        needsOnboarding,
      },
      'Session retrieved'
    );
  } catch (error) {
    console.error('Mobile me error:', error);
    return mobileError('Failed to get session', 500);
  }
}
