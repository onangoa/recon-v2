import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mobileAuth, mobileSuccess, mobileError } from '@/lib/mobile-auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await mobileAuth(request);
    if (!auth.authenticated || !auth.userId) {
      return mobileError('Unauthenticated.', 401);
    }

    const body = await request.json();
    const { siteId } = body;

    if (!siteId) {
      return mobileError('Site ID is required', 400);
    }

    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        contractorId: auth.contractorId || undefined,
      },
    });

    if (!site) {
      return mobileError('Site not found', 404);
    }

    return mobileSuccess(
      {
        siteId,
        name: site.name,
        location: site.location,
      },
      'Site selected'
    );
  } catch (error) {
    console.error('Mobile select site error:', error);
    return mobileError('Failed to select site', 500);
  }
}
