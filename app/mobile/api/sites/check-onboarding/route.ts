import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileAuth,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await mobileAuth(request);
    if (!auth.authenticated) {
      return mobileError('Unauthenticated.', 401);
    }

    if (!auth.contractorId) {
      return mobileSuccess({ needsOnboarding: true, hasSites: false });
    }

    const siteCount = await prisma.site.count({
      where: { contractorId: auth.contractorId },
    });

    return mobileSuccess({
      needsOnboarding: siteCount === 0,
      hasSites: siteCount > 0,
      siteCount,
    });
  } catch (error) {
    console.error('Onboarding check error:', error);
    return mobileError('Failed to check onboarding status', 500);
  }
}
