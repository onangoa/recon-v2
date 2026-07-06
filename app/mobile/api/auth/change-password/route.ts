import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  comparePassword,
  hashPassword,
  revokeAllUserRefreshTokens,
} from '@/lib/jwt';
import { mobileAuth, mobileSuccess, mobileError } from '@/lib/mobile-auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await mobileAuth(request);
    if (!auth.authenticated || !auth.userId) {
      return mobileError('Unauthenticated.', 401);
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return mobileError('Current password and new password are required', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
    });

    if (!user) {
      return mobileError('User not found', 404);
    }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return mobileError('Current password is incorrect', 400);
    }

    if (newPassword.length < 8) {
      return mobileError('New password must be at least 8 characters', 400);
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await revokeAllUserRefreshTokens(user.id);

    return mobileSuccess(null, 'Password updated successfully');
  } catch (error) {
    console.error('Mobile change password error:', error);
    return mobileError('Failed to change password', 500);
  }
}
