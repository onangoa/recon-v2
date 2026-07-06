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
    const subscriptions = await prisma.contractor.findMany({
      select: {
        id: true,
        companyName: true,
        subscriptionPlan: true,
        updatedAt: true,
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    return mobileSuccess(subscriptions);
  } catch (error) {
    return mobileError('Failed to fetch subscriptions', 500);
  }
}

export async function PATCH(request: NextRequest) {
  const permCheck = await mobileRequireSuperadmin(request);
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const body = await request.json();
    const { contractorId, planId } = body;

    const subscription = await prisma.contractor.update({
      where: { id: contractorId },
      data: {
        subscriptionPlanId: planId,
      },
      include: {
        subscriptionPlan: true,
      }
    });

    return mobileSuccess(subscription, 'Subscription updated');
  } catch (error) {
    return mobileError('Failed to update subscription', 500);
  }
}
