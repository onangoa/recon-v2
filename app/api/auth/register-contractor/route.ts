import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      password, 
      name, 
      companyName, 
      phoneNumber, 
      licenseNo, 
      location, 
      planId,
      checkoutRequestId 
    } = body;

    // 1. Verify Payment was successful
    const transaction = await prisma.transaction.findFirst({
      where: { externalId: checkoutRequestId, status: 'completed' },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Payment not verified. Please ensure you have paid.' },
        { status: 400 }
      );
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists.' },
        { status: 400 }
      );
    }

    // 3. Create User and Contractor in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password, // In production, use bcrypt
          name,
          role: 'contractor',
        },
      });

      const contractor = await tx.contractor.create({
        data: {
          userId: user.id,
          companyName,
          location,
          phoneNumber,
          licenseNo,
          subscriptionPlanId: planId,
        },
      });

      return { user, contractor };
    });

    return NextResponse.json(
      {
        message: 'Contractor registered successfully',
        userId: result.user.id,
        contractorId: result.contractor.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Contractor Registration Error:', error.message);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
