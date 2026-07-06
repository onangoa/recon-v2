import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequireSuperadmin,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireSuperadmin(request);
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, price, maxTeamMembers, features, isActive } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = parseFloat(price);
    updateData.maxSites = 1;
    if (maxTeamMembers !== undefined) updateData.maxTeamMembers = parseInt(maxTeamMembers);
    if (features !== undefined) updateData.features = JSON.stringify(features);
    if (isActive !== undefined) updateData.isActive = isActive;

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: updateData,
    });

    return mobileSuccess(plan, 'Plan updated');
  } catch (error: any) {
    console.error('Update plan error:', error);

    if (error.code === 'P2002') {
      return mobileError('A plan with this name already exists', 409);
    }

    return mobileError('Failed to update plan', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireSuperadmin(request);
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const { id } = await params;
    const contractors = await prisma.contractor.findFirst({
      where: { subscriptionPlanId: id },
    });

    if (contractors) {
      return mobileError('Cannot delete plan as it is currently being used by contractors. Try deactivating it instead.', 400);
    }

    await prisma.subscriptionPlan.delete({
      where: { id },
    });

    return mobileSuccess(null, 'Plan deleted');
  } catch (error) {
    console.error('Delete plan error:', error);
    return mobileError('Failed to delete plan', 500);
  }
}
