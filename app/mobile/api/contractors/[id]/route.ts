import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequirePermission(request, 'settings:read');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const { id } = await params;
    const contractor = await prisma.contractor.findUnique({
      where: { id },
      include: {
        user: true,
        subscriptionPlan: true,
        projects: true,
      },
    });
    if (!contractor) {
      return mobileError('Contractor not found', 404);
    }
    return mobileSuccess(contractor);
  } catch (error) {
    return mobileError('Failed to fetch contractor', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequirePermission(request, 'settings:update');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const { id } = await params;
    const body = await request.json();
    const contractor = await prisma.contractor.update({
      where: { id },
      data: body,
      include: {
        user: true,
        subscriptionPlan: true,
      },
    });
    return mobileSuccess(contractor, 'Contractor updated');
  } catch (error) {
    return mobileError('Failed to update contractor', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequirePermission(request, 'settings:manage');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const { id } = await params;
    await prisma.contractor.delete({
      where: { id },
    });
    return mobileSuccess(null, 'Contractor deleted');
  } catch (error) {
    return mobileError('Failed to delete contractor', 500);
  }
}
