import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { userId } = await params;

  const body = await request.json();
  const name = [body.first_name, body.last_name].filter(Boolean).join(' ');

  const data: any = {};
  if (name) data.name = name;
  if (body.email) data.email = body.email;
  if (body.role) data.role = body.role;

  if (body.phone !== undefined) {
    await prisma.teamMember.updateMany({
      where: { userId },
      data: { phone: body.phone },
    });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    include: { contractor: true, teamMember: true },
  });

  return mobileSuccess({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
  }, 'User updated successfully');
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { userId } = await params;

  const formData = await request.formData();
  const file = formData.get('upload') as File | null;
  if (!file) return mobileError('No file uploaded', 400);

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString('base64');
  const mimeType = file.type || 'image/jpeg';
  const dataUrl = `data:${mimeType};base64,${base64}`;

  await prisma.user.update({
    where: { id: userId },
    data: { avatar: dataUrl },
  });

  return mobileSuccess({ avatar: dataUrl }, 'Profile image uploaded successfully');
}