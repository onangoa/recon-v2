import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  if (!auth.userId) return mobileError('User not found', 404);

  const body = await request.json();
  const { current_password, new_password, new_password_confirmation } = body;

  if (!current_password || !new_password || !new_password_confirmation) {
    return mobileError('All password fields are required', 400);
  }

  if (new_password !== new_password_confirmation) {
    return mobileError('New password confirmation does not match', 400);
  }

  const user = await prisma.user.findUnique({ where: { id: auth.userId } });
  if (!user) return mobileError('User not found', 404);

  const isValid = await bcrypt.compare(current_password, user.password);
  if (!isValid) return mobileError('Current password is incorrect', 400);

  const hashedPassword = await bcrypt.hash(new_password, 10);
  await prisma.user.update({
    where: { id: auth.userId },
    data: { password: hashedPassword },
  });

  return mobileSuccess(null, 'Password changed successfully');
}