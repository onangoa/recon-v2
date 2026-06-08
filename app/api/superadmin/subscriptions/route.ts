import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
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
    return NextResponse.json(subscriptions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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

    return NextResponse.json(subscription);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}
