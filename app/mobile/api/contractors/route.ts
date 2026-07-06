import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
  mobileList,
} from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  const permCheck = await mobileRequirePermission(request, 'dashboard:read');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const where = permCheck.contractorId ? { id: permCheck.contractorId } : {};

    const [contractors, total] = await Promise.all([
      prisma.contractor.findMany({
        where,
        include: {
          user: true,
          subscriptionPlan: true,
          sites: true,
        },
        take: limit,
        skip: skip,
      }),
      prisma.contractor.count({ where })
    ]);

    return mobileList(contractors, total, {
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Failed to fetch contractors:', error);
    return mobileError('Failed to fetch contractors', 500);
  }
}

export async function POST(request: NextRequest) {
  const permCheck = await mobileRequirePermission(request, 'settings:manage');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const body = await request.json();
    const contractor = await prisma.contractor.create({
      data: {
        userId: body.userId,
        companyName: body.companyName,
        location: body.location,
        phoneNumber: body.phoneNumber,
        licenseNo: body.licenseNo,
        subscriptionPlanId: body.subscriptionPlanId,
      },
      include: {
        user: true,
        subscriptionPlan: true,
      },
    });
    return mobileSuccess(contractor, 'Contractor created');
  } catch (error) {
    return mobileError('Failed to create contractor', 500);
  }
}
