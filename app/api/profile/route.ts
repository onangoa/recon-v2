import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  if (!auth.userId) return mobileError('User not found', 404);

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    include: { contractor: true, teamMember: true },
  });
  if (!user) return mobileError('User not found', 404);

  const nameParts = user.name.split(' ');

  return mobileSuccess({
    id: user.id,
    email: user.email,
    first_name: nameParts[0] || '',
    last_name: nameParts.slice(1).join(' ') || '',
    phone: user.teamMember?.phone || user.contractor?.phoneNumber || null,
    avatar: user.avatar,
    role: user.role,
    company_name: user.contractor?.companyName || null,
  });
}

export async function PUT(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  if (!auth.userId) return mobileError('User not found', 404);

  const body = await request.json();
  const name = [body.first_name, body.last_name].filter(Boolean).join(' ') || undefined;

  const data: any = {};
  if (name) data.name = name;
  if (body.phone !== undefined) {
    await prisma.teamMember.updateMany({
      where: { userId: auth.userId },
      data: { phone: body.phone },
    });
  }

  const user = await prisma.user.update({
    where: { id: auth.userId },
    data,
    include: { contractor: true, teamMember: true },
  });

  const nameParts = user.name.split(' ');

  return mobileSuccess({
    id: user.id,
    email: user.email,
    first_name: nameParts[0] || '',
    last_name: nameParts.slice(1).join(' ') || '',
    phone: user.teamMember?.phone || user.contractor?.phoneNumber || null,
    avatar: user.avatar,
    role: user.role,
  }, 'Profile updated successfully');
}