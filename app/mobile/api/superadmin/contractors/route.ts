import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { hashPassword } from '@/lib/jwt';
import {
  mobileRequireSuperadmin,
  mobileSuccess,
  mobileError,
  mobileList,
} from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  const permCheck = await mobileRequireSuperadmin(request);
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [contractors, total] = await Promise.all([
      prisma.contractor.findMany({
        skip,
        take: limit,
        include: {
          user: true,
          subscriptionPlan: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.contractor.count(),
    ]);

    return mobileList(contractors, total, {
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return mobileError('Failed to fetch contractors', 500);
  }
}

export async function POST(request: NextRequest) {
  const permCheck = await mobileRequireSuperadmin(request);
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const body = await request.json();
    const { name, email, companyName, location, phoneNumber, licenseNo, subscriptionPlanId, password } = body;

    if (!subscriptionPlanId) {
      return mobileError('Subscription plan is mandatory', 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return mobileError('A user with this email address already exists', 400);
    }

    const plainPassword = password || crypto.randomBytes(8).toString('hex');
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: await hashPassword(plainPassword),
        role: 'contractor',
      },
    });

    const contractor = await prisma.contractor.create({
      data: {
        userId: user.id,
        companyName,
        location,
        phoneNumber,
        licenseNo,
        subscriptionPlanId,
      },
    });

    return mobileSuccess(contractor, 'Contractor created');
  } catch (error) {
    console.error('Create contractor error:', error);
    return mobileError('Failed to create contractor', 500);
  }
}
