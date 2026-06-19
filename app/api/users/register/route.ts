import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateAccessToken, generateRefreshToken, saveRefreshToken } from '@/lib/jwt';
import { mobileError, mobileSuccess } from '@/lib/mobile-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { first_name, last_name, email, password, password_confirmation, phone } = body;

    if (!email || !password) {
      return mobileError('Email and password are required', 400);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return mobileError('Email already registered', 400);
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

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      contractorId: null,
    });

    const refreshToken = generateRefreshToken(user.id);
    await saveRefreshToken(user.id, refreshToken);

    return mobileSuccess({
      access_token: accessToken,
      user: {
        id: user.id,
        first_name: first_name || '',
        last_name: last_name || '',
        email: user.email,
        phone: phone || null,
        role: 'user',
      },
    }, 'User registered successfully');
  } catch (error: any) {
    return mobileError(error.message || 'Registration failed', 500);
  }
}