import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequirePermission(request, 'settings:read');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const { id } = await params;
    const contractor = await prisma.contractor.findUnique({
      where: { id },
      include: {
        subscriptionPlan: true,
      },
    });

    const allPlans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true }
    });

    return mobileSuccess({
      currentPlan: contractor?.subscriptionPlan,
      status: contractor?.subscriptionStatus,
      endDate: contractor?.subscriptionEndDate,
      availablePlans: allPlans
    });
  } catch (error) {
    return mobileError('Failed to fetch subscription data', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequirePermission(request, 'settings:update');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const { id } = await params;
    const body = await request.json();

    const contractor = await prisma.contractor.update({
      where: { id },
      data: {
        subscriptionPlanId: body.planId,
        subscriptionStatus: 'active',
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      include: {
        subscriptionPlan: true,
      },
    });

    return mobileSuccess(contractor, 'Subscription updated');
  } catch (error) {
    return mobileError('Failed to update subscription', 500);
  }
}
