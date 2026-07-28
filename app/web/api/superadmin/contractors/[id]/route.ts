import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperadmin } from '@/lib/require-permission';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireSuperadmin(request);
  if (!adminCheck.authorized) return adminCheck.error;
  try {
    const { id } = await params;

    const contractor = await prisma.contractor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        subscriptionPlan: {
          select: {
            name: true,
            price: true,
          },
        },
        projects: true,
        wallets: true,
      },
    });

    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    return NextResponse.json(contractor);
  } catch (error) {
    console.error('Get contractor error:', error);
    return NextResponse.json({ error: 'Failed to fetch contractor' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireSuperadmin(request);
  if (!adminCheck.authorized) return adminCheck.error;
  try {
    const { id } = await params;
    const body = await request.json();
    const { companyName, location, phoneNumber, licenseNo, subscriptionPlanId, name, email } = body;

    const contractor = await prisma.contractor.update({
      where: { id },
      data: {
        companyName,
        location,
        phoneNumber,
        licenseNo,
        subscriptionPlanId,
        user: {
          update: {
            name,
            email,
          },
        },
      },
    });

    return NextResponse.json(contractor);
  } catch (error) {
    console.error('Update contractor error:', error);
    return NextResponse.json({ error: 'Failed to update contractor' }, { status: 500 });
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
    const contractor = await prisma.contractor.findUnique({
      where: { id },
    });

    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    // Delete contractor and user
    await prisma.user.delete({
      where: { id: contractor.userId },
    });

    return NextResponse.json({ message: 'Contractor deleted' });
  } catch (error) {
    console.error('Delete contractor error:', error);
    return NextResponse.json({ error: 'Failed to delete contractor' }, { status: 500 });
  }
}
