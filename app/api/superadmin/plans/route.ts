import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: {
        price: 'asc',
      },
    });
    return NextResponse.json(plans);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, price, maxSites, maxTeamMembers, features } = body;

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        price: parseFloat(price),
        maxSites: parseInt(maxSites),
        maxTeamMembers: parseInt(maxTeamMembers),
        features: JSON.stringify(features),
      },
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Create plan error:', error);
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}
