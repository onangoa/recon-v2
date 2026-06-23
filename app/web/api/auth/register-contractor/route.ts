import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateAccessToken, generateRefreshToken, saveRefreshToken } from '@/lib/jwt';
import { getPermissions } from '@/lib/rbac';

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
      checkoutRequestId,
    } = body;

    const transaction = await prisma.transaction.findFirst({
      where: { externalId: checkoutRequestId, status: 'completed' },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Payment not verified. Please ensure you have paid.' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists.' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
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
          licenseNo: licenseNo || '',
          subscriptionPlanId: planId,
        },
      });

      return { user, contractor };
    });

    const accessToken = generateAccessToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      contractorId: result.contractor.id,
    });

    const refreshToken = generateRefreshToken(result.user.id);
    await saveRefreshToken(result.user.id, refreshToken);

    const permissions = await getPermissions(result.user.id);

    const response = NextResponse.json({
      message: 'Contractor registered successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        name: result.user.name,
        avatar: result.user.avatar,
        permissions,
      },
      contractor: {
        id: result.contractor.id,
        companyName: result.contractor.companyName,
        location: result.contractor.location,
        phoneNumber: result.contractor.phoneNumber,
        licenseNo: result.contractor.licenseNo,
        userId: result.contractor.userId,
      },
      sites: [],
      selectedSiteId: null,
      needsOnboarding: true,
    }, { status: 201 });

    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Contractor Registration Error:', error.message);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}