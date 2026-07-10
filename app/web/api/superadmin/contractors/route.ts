import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { hashPassword } from '@/lib/jwt';
import { requireSuperadmin } from '@/lib/require-permission';

export async function GET(request: Request) {
  const adminCheck = await requireSuperadmin(request);
  if (!adminCheck.authorized) return adminCheck.error;
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

    return NextResponse.json({
      contractors,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contractors' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const adminCheck = await requireSuperadmin(request);
  if (!adminCheck.authorized) return adminCheck.error;
  try {
    const body = await request.json();
    const { name, email, companyName, location, phoneNumber, licenseNo, subscriptionPlanId, password } = body;

    // Validate plan
    if (!subscriptionPlanId) {
      return NextResponse.json({ error: 'Subscription plan is mandatory' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email address already exists' },
        { status: 400 }
      );
    }

    // Create user first
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

    return NextResponse.json(contractor);
  } catch (error) {
    console.error('Create contractor error:', error);
    return NextResponse.json({ error: 'Failed to create contractor' }, { status: 500 });
  }
}
