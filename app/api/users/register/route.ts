import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateAccessToken, generateRefreshToken, saveRefreshToken } from '@/lib/jwt';
import { cuidToInt } from '@/lib/mobile-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { first_name, last_name, email, password, password_confirmation, phone } = body;

    if (!email || !password) {
      return Response.json({
        error: true,
        message: {
          email: !email ? ['The email field is required.'] : undefined,
          password: !password ? ['The password field is required.'] : undefined,
        },
      }, { status: 422 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json({
        error: true,
        message: {
          email: ['The email has already been taken.'],
        },
      }, { status: 422 });
    }

    if (password.length < 6) {
      return Response.json({
        error: true,
        message: {
          password: ['Password must be at least 6 characters long.'],
        },
      }, { status: 422 });
    }

    const name = [first_name, last_name].filter(Boolean).join(' ');
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        phone: phone || null,
        role: 'contractor',
      },
    });

    const session = {
      id: cuidToInt(user.id),
      email: user.email,
      name: user.name,
      role: 'user',
    };

    return Response.json({
      error: false,
      session,
      message: 'Registration data saved. Please complete your subscription to create your account.',
      redirect_url: '/subscription-plan/index',
    });
  } catch (error: any) {
    return Response.json({ error: true, message: error.message || 'Registration failed' }, { status: 500 });
  }
}