import { NextRequest } from 'next/server';
import { mobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }

  if (!auth.userId) return Response.json({ success: false, message: 'User not found' }, { status: 404 });

  try {
    await prisma.user.delete({ where: { id: auth.userId } });
    return Response.json({ success: true, message: 'Account deleted successfully' });
  } catch (error: any) {
    return Response.json({ success: false, message: 'Failed to delete account', error: error.message }, { status: 500 });
  }
}