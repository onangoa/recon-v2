import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, companyName, phoneNumber, licenseNo, location } = body;

    if (!email || !password || !name || !companyName) {
      return NextResponse.json(
        { error: 'Name, email, password, and company name are required' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // Fetch all permissions to grant the new contractor owner full access
    const allPermissions = await prisma.permission.findMany({ select: { id: true } });

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
          location: location || '',
          phoneNumber: phoneNumber || '',
          licenseNo: licenseNo || '',
        },
      });

      // Create a default wallet for the contractor
      await tx.wallet.create({
        data: {
          name: `${companyName} Wallet`,
          description: 'Default wallet for business operations',
          currency: 'KES',
          contractorId: contractor.id,
        }
      });

      // Grant the new owner full access within their own contractor account
      // by creating a "Contractor Admin" role scoped to this contractor and
      // attaching it to the user. Without this, requirePermission() denies
      // every action (including sites:create during onboarding).
      const adminRole = await tx.role.create({
        data: {
          name: 'Contractor Admin',
          description: 'Full access to contractor dashboard',
          scope: 'contractor',
          contractorId: contractor.id,
          permissions: {
            connect: allPermissions.map((p) => ({ id: p.id })),
          },
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { roleId: adminRole.id },
      });

      return { user, contractor };
    });

    return NextResponse.json(
      {
        message: 'Registration successful',
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role,
        contractorId: result.contractor.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
