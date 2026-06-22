import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/require-permission';

export async function GET(request: NextRequest) {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' },
    });
    return NextResponse.json(plans);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const permCheck = await requirePermission(request, 'settings:manage');
  if (!permCheck.authorized) return permCheck.error;
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
