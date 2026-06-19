import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperadmin } from '@/lib/require-permission';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const adminCheck = await requireSuperadmin(request);
  if (!adminCheck.authorized) return adminCheck.error;
  try {
    const body = await request.json();
    const { name, email, password } = body;

    const data: any = { name, email };
    if (password) data.password = password;

    const admin = await prisma.user.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(admin);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const adminCheck = await requireSuperadmin(request);
  if (!adminCheck.authorized) return adminCheck.error;
  try {
    // Prevent self-deletion if possible (logic would need current user ID)
    await prisma.user.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: 'Admin deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 });
  }
}
