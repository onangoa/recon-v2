import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAccessToken(accessToken);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!payload.contractorId) {
      return NextResponse.json({ needsOnboarding: true, hasSites: false });
    }

    const siteCount = await prisma.site.count({
      where: { contractorId: payload.contractorId },
    });

    return NextResponse.json({
      needsOnboarding: siteCount === 0,
      hasSites: siteCount > 0,
      siteCount,
    });
  } catch (error) {
    console.error('Onboarding check error:', error);
    return NextResponse.json({ error: 'Failed to check onboarding status' }, { status: 500 });
  }
}