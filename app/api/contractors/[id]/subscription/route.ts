import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    return NextResponse.json({
      currentPlan: contractor?.subscriptionPlan,
      status: contractor?.subscriptionStatus,
      endDate: contractor?.subscriptionEndDate,
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
  try {
    const { id } = await params;
    const body = await request.json();
    
    const contractor = await prisma.contractor.update({
      where: { id },
      data: {
        subscriptionPlanId: body.planId,
        subscriptionStatus: 'active',
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      include: {
        subscriptionPlan: true,
      },
    });

    return NextResponse.json(contractor);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}
