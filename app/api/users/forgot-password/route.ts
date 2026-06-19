import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mobileError, mobileSuccess } from '@/lib/mobile-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return mobileError('Email is required', 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return mobileSuccess(null, 'Reset password instructions sent to your email.');
    }

    return mobileSuccess(null, 'Reset password instructions sent to your email.');
  } catch (error: any) {
    return mobileError(error.message || 'Failed to process request', 500);
  }
}