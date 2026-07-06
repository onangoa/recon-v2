import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequireSuperadmin,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireSuperadmin(request);
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, password } = body;

    const data: any = { name, email };
    if (password) data.password = password;

    const admin = await prisma.user.update({
      where: { id },
      data,
    });

    return mobileSuccess(admin, 'Admin updated');
  } catch (error) {
    return mobileError('Failed to update admin', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permCheck = await mobileRequireSuperadmin(request);
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const { id } = await params;
    await prisma.user.delete({
      where: { id },
    });
    return mobileSuccess(null, 'Admin deleted');
  } catch (error) {
    return mobileError('Failed to delete admin', 500);
  }
}
