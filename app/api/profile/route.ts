import { NextRequest } from 'next/server';
import { mobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }

  if (!auth.userId) return Response.json({ success: false, message: 'User not found' }, { status: 404 });

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    include: { contractor: true, teamMember: true },
  });
  if (!user) return Response.json({ success: false, message: 'User not found' }, { status: 404 });

  const nameParts = user.name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return Response.json({
    success: true,
    message: 'Profile retrieved successfully',
    data: {
      id: user.id,
      first_name: firstName,
      last_name: lastName,
      email: user.email,
      phone: user.teamMember?.phone || user.contractor?.phoneNumber || null,
      photo_url: user.avatar ? `/storage/${user.avatar}` : '/storage/photos/no-image.jpg',
      address: null,
      city: null,
      state: null,
      country: null,
      zip: null,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    },
  });
}

export async function PUT(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }

  if (!auth.userId) return Response.json({ success: false, message: 'User not found' }, { status: 404 });

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

  return Response.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      id: user.id,
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      email: user.email,
      phone: user.teamMember?.phone || user.contractor?.phoneNumber || null,
      address: null,
      city: null,
      state: null,
      country: null,
      zip: null,
    },
  });
}