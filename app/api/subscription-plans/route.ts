import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      include: {
        contractors: true,
      },
    });
    return NextResponse.json(plans);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: body.name,
        price: body.price,
        maxSites: body.maxSites,
        maxTeamMembers: body.maxTeamMembers,
        features: body.features,
      },
    });
    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}
