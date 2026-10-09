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

    const siteCount = await prisma.site.count({ where: { contractorId: id } });

    const allPlans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true }
    });

    return mobileSuccess({
      currentPlan: contractor?.subscriptionPlan,
      status: contractor?.subscriptionStatus,
      endDate: contractor?.subscriptionEndDate,
      purchasedSiteSlots: contractor?.purchasedSiteSlots ?? 1,
      usedSiteSlots: siteCount,
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

    const updateData: any = {
      subscriptionStatus: 'active',
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
    if (body.planId) updateData.subscriptionPlanId = body.planId;

    if (body.subscribeAgain) {
      const current = await prisma.contractor.findUnique({
        where: { id },
        select: { purchasedSiteSlots: true },
      });
      updateData.purchasedSiteSlots = (current?.purchasedSiteSlots ?? 1) + 1;
    }

    const contractor = await prisma.contractor.update({
      where: { id },
      data: updateData,
      include: {
        subscriptionPlan: true,
      },
    });

    return mobileSuccess(contractor, 'Subscription updated');
  } catch (error) {
    return mobileError('Failed to update subscription', 500);
  }
}
