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
    const hashedPassword = await hashPassword(plainPassword);

    const allPermissions = await prisma.permission.findMany({ select: { id: true } });

    const contractor = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: 'contractor',
        },
      });

      const newContractor = await tx.contractor.create({
        data: {
          userId: user.id,
          companyName,
          location,
          phoneNumber,
          licenseNo,
          subscriptionPlanId,
        },
      });

      const adminRole = await tx.role.create({
        data: {
          name: 'Contractor Admin',
          description: 'Full access to contractor dashboard',
          scope: 'contractor',
          contractorId: newContractor.id,
          permissions: {
            connect: allPermissions.map((p) => ({ id: p.id })),
          },
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { roleId: adminRole.id },
      });

      return newContractor;
    });

    return mobileSuccess(contractor, 'Contractor created');
  } catch (error) {
    console.error('Create contractor error:', error);
    return mobileError('Failed to create contractor', 500);
  }
}
