import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperadmin } from '@/lib/require-permission';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireSuperadmin(request);
  if (!adminCheck.authorized) return adminCheck.error;
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, price, maxSites, maxTeamMembers, features, isActive } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (maxSites !== undefined) updateData.maxSites = parseInt(maxSites);
    if (maxTeamMembers !== undefined) updateData.maxTeamMembers = parseInt(maxTeamMembers);
    if (features !== undefined) updateData.features = JSON.stringify(features);
    if (isActive !== undefined) updateData.isActive = isActive;

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(plan);
  } catch (error: any) {
    console.error('Update plan error:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'A plan with this name already exists',
        field: 'name'
      }, { status: 409 });
    }
    
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireSuperadmin(request);
  if (!adminCheck.authorized) return adminCheck.error;
  try {
    const { id } = await params;
    // Check if any contractor is using this plan
    const contractors = await prisma.contractor.findFirst({
      where: { subscriptionPlanId: id },
    });

    if (contractors) {
      return NextResponse.json({ 
        error: 'Cannot delete plan as it is currently being used by contractors. Try deactivating it instead.' 
      }, { status: 400 });
    }

    await prisma.subscriptionPlan.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Plan deleted' });
  } catch (error) {
    console.error('Delete plan error:', error);
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
  }
}
