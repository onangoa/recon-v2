import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, price, maxSites, maxTeamMembers, features } = body;

    const plan = await prisma.subscriptionPlan.update({
      where: { id: params.id },
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
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if any contractor is using this plan
    const contractors = await prisma.contractor.findFirst({
      where: { subscriptionPlanId: params.id },
    });

    if (contractors) {
      return NextResponse.json({ 
        error: 'Cannot delete plan as it is currently being used by contractors' 
      }, { status: 400 });
    }

    await prisma.subscriptionPlan.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Plan deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
  }
}
