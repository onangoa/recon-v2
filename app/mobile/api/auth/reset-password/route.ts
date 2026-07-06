import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, revokeAllUserRefreshTokens } from '@/lib/jwt';
import crypto from 'crypto';
import { mobileSuccess, mobileError } from '@/lib/mobile-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return mobileError('Token and password are required', 400);
    }

    if (password.length < 8) {
      return mobileError('Password must be at least 8 characters long', 400);
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!resetToken) {
      return mobileError('Invalid or expired reset token', 400);
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      return mobileError('Reset token has expired', 400);
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    await revokeAllUserRefreshTokens(resetToken.userId);

    return mobileSuccess(null, 'Password has been reset successfully');
  } catch (error) {
    console.error('Mobile reset password error:', error);
    return mobileError('An error occurred while processing your request', 500);
  }
}
