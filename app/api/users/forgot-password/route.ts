import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return Response.json({ error: true, message: 'Email is required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return Response.json({ error: true, message: 'Password reset link couldn\'t be sent.' });
    }

    return Response.json({ error: false, message: 'Password reset link emailed successfully.' });
  } catch (error: any) {
    return Response.json({ error: true, message: 'Password reset link couldn\'t be sent.' });
  }
}