import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequireSuperadmin,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireSuperadmin(request);
  if (!permCheck.authorized) return permCheck.error!;
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
        employees: true,
        projects: true,
        invoices: true,
        wallets: true,
      },
    });

    if (!contractor) {
      return mobileError('Contractor not found', 404);
    }

    return mobileSuccess(contractor);
  } catch (error) {
    console.error('Get contractor error:', error);
    return mobileError('Failed to fetch contractor', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireSuperadmin(request);
  if (!permCheck.authorized) return permCheck.error!;
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

    return mobileSuccess(contractor, 'Contractor updated');
  } catch (error) {
    console.error('Update contractor error:', error);
    return mobileError('Failed to update contractor', 500);
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
    const contractor = await prisma.contractor.findUnique({
      where: { id },
    });

    if (!contractor) {
      return mobileError('Contractor not found', 404);
    }

    await prisma.user.delete({
      where: { id: contractor.userId },
    });

    return mobileSuccess(null, 'Contractor deleted');
  } catch (error) {
    console.error('Delete contractor error:', error);
    return mobileError('Failed to delete contractor', 500);
  }
}
