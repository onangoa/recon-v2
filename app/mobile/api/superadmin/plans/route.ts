import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequireSuperadmin,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  const permCheck = await mobileRequireSuperadmin(request);
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      include: {
        _count: {
          select: { contractors: true }
        }
      },
      orderBy: {
        price: 'asc',
      },
    });
    return mobileSuccess(plans);
  } catch (error) {
    return mobileError('Failed to fetch plans', 500);
  }
}

export async function POST(request: NextRequest) {
  const permCheck = await mobileRequireSuperadmin(request);
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const body = await request.json();
    const { name, price, maxTeamMembers, features, isActive } = body;

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        price: parseFloat(price),
        maxSites: 1,
        maxTeamMembers: parseInt(maxTeamMembers),
        features: JSON.stringify(features),
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return mobileSuccess(plan, 'Plan created');
  } catch (error: any) {
    console.error('Create plan error:', error);

    if (error.code === 'P2002') {
      return mobileError('A plan with this name already exists', 409);
    }

    return mobileError('Failed to create plan', 500);
  }
}
