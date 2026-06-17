import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Find user with contractor relation
    const user = await prisma.user.findUnique({
      where: { email },
      include: { contractor: true }
    });

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Log login activity if contractor exists
    if (user.contractor) {
      await ActivityLogger.log({
        userId: user.id,
        contractorId: user.contractor.id,
        action: 'LOGIN',
        module: 'SETTINGS',
        description: `${user.name} logged in`,
      });
    }
// Get permissions
const { getPermissions } = await import('@/lib/rbac');
const permissions = await getPermissions(user.id);
const response = NextResponse.json(
  {
    message: 'Login successful',
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    permissions,
    contractor: user.contractor ? {
      id: user.contractor.id,
      companyName: user.contractor.companyName,
      location: user.contractor.location,
      phoneNumber: user.contractor.phoneNumber,
      licenseNo: user.contractor.licenseNo,
      userId: user.contractor.userId,
    } : null,
  },
  { status: 200 }
);

    response.cookies.set('sessionId', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
