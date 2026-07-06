import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  try {
    const permCheck = await mobileRequirePermission(request, 'settings:read');
    if (!permCheck.authorized) return permCheck.error!;

    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' },
    });
    return mobileSuccess(plans);
  } catch (error) {
    return mobileError('Failed to fetch plans', 500);
  }
}

export async function POST(request: NextRequest) {
  const permCheck = await mobileRequirePermission(request, 'settings:manage');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const body = await request.json();
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: body.name,
        price: body.price,
        maxSites: 1,
        maxTeamMembers: body.maxTeamMembers,
        features: body.features,
      },
    });
    return mobileSuccess(plan, 'Plan created');
  } catch (error) {
    return mobileError('Failed to create plan', 500);
  }
}
