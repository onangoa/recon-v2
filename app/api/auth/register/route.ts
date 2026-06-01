import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password, // In production, use bcrypt
        name,
        role,
      },
    });

    return NextResponse.json(
      {
        message: 'User created successfully',
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
