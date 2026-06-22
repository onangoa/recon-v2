import { NextRequest } from 'next/server';
import { mobileAuth, cuidToInt } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId! },
    include: { roleRelation: true },
  });

  if (!user) {
    return Response.json({ success: false, message: 'User not found' }, { status: 404 });
  }

  const firstName = (user.name || '').split(' ')[0] || null;
  const lastName = (user.name || '').split(' ').slice(1).join(' ') || null;
  const role = user.roleRelation?.name || user.role;
  const isSuperadmin = user.role === 'superadmin';

  return Response.json({
    success: true,
    message: 'Token is valid',
    data: {
      id: cuidToInt(user.id),
      first_name: firstName,
      last_name: lastName,
      full_name: [firstName, lastName].filter(Boolean).join(' '),
      email: user.email,
      phone: user.teamMember?.phone || user.contractor?.phoneNumber || null,
      status: 1,
      email_verified: true,
      photo_url: user.avatar ? `/storage/${user.avatar}` : '/storage/photos/no-image.jpg',
      role,
      account_type: isSuperadmin ? 'admin' : 'user',
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    },
  });
}