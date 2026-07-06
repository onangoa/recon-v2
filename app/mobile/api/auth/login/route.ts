import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import {
  generateAccessToken,
  generateRefreshToken,
  comparePassword,
  saveRefreshToken,
} from '@/lib/jwt';
import { getPermissions } from '@/lib/rbac';
import { resolveContractorForUser } from '@/lib/auth';
import { mobileSuccess, mobileError } from '@/lib/mobile-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return mobileError('Email and password are required', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { contractor: true, teamMember: true },
    });

    if (!user) {
      return mobileError('Invalid email or password', 401);
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return mobileError('Invalid email or password', 401);
    }

    const contractor = await resolveContractorForUser(user.id);

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      contractorId: contractor?.id || null,
    });

    const refreshToken = generateRefreshToken(user.id);
    await saveRefreshToken(user.id, refreshToken);

    if (contractor) {
      try {
        await ActivityLogger.log({
          userId: user.id,
          contractorId: contractor.id,
          action: 'LOGIN',
          module: 'SETTINGS',
          description: `${user.name} logged in (mobile)`,
        });
      } catch (e) {
        console.error('Activity log error:', e);
      }
    }

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
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: 15 * 60,
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
        selectedSiteId:
          sites.find((s) => s.isPrimary)?.id || (sites.length > 0 ? sites[0].id : null),
        needsOnboarding,
      },
      'Login successful'
    );
  } catch (error) {
    console.error('Mobile login error:', error);
    return mobileError('Login failed', 500);
  }
}
