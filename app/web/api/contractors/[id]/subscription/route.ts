import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requirePermission(request, 'settings:read');
  if (!permCheck.authorized) return permCheck.error;
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

    return NextResponse.json({
      currentPlan: contractor?.subscriptionPlan,
      status: contractor?.subscriptionStatus,
      endDate: contractor?.subscriptionEndDate,
      purchasedSiteSlots: contractor?.purchasedSiteSlots ?? 1,
      usedSiteSlots: siteCount,
      availablePlans: allPlans
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch subscription data' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await requirePermission(request, 'settings:update');
  if (!permCheck.authorized) return permCheck.error;
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: any = {
      subscriptionStatus: 'active',
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
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

    return NextResponse.json(contractor);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}
