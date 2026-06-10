import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET() {
  try {
    const contractors = await prisma.contractor.findMany({
      include: {
        user: true,
        subscriptionPlan: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(contractors);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contractors' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: password || crypto.randomBytes(8).toString('hex'),
        role: 'contractor',
      },
    });

    // Create contractor
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

    return NextResponse.json(contractor);
  } catch (error) {
    console.error('Create contractor error:', error);
    return NextResponse.json({ error: 'Failed to create contractor' }, { status: 500 });
  }
}
