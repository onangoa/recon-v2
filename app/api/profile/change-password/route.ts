import { NextRequest } from 'next/server';
import { mobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }

  if (!auth.userId) return Response.json({ success: false, message: 'User not found' }, { status: 404 });

  const body = await request.json();
  const { current_password, new_password, new_password_confirmation } = body;

  if (!current_password || !new_password || !new_password_confirmation) {
    return Response.json({ success: false, message: 'All password fields are required' }, { status: 422 });
  }

  if (new_password !== new_password_confirmation) {
    return Response.json({ success: false, message: 'New password confirmation does not match' }, { status: 422 });
  }

  const user = await prisma.user.findUnique({ where: { id: auth.userId } });
  if (!user) return Response.json({ success: false, message: 'User not found' }, { status: 404 });

  const isValid = await bcrypt.compare(current_password, user.password);
  if (!isValid) return Response.json({ success: false, message: 'Current password is incorrect' }, { status: 422 });

  const hashedPassword = await bcrypt.hash(new_password, 10);
  await prisma.user.update({
    where: { id: auth.userId },
    data: { password: hashedPassword },
  });

  return Response.json({ success: true, message: 'Password changed successfully' });
}