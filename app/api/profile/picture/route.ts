import { NextRequest } from 'next/server';
import { mobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }

  if (!auth.userId) return Response.json({ success: false, message: 'User not found' }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get('profile_image') as File | null;
  if (!file) return Response.json({ success: false, message: 'No profile image provided' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString('base64');
  const mimeType = file.type || 'image/jpeg';
  const dataUrl = `data:${mimeType};base64,${base64}`;

  await prisma.user.update({
    where: { id: auth.userId },
    data: { avatar: dataUrl },
  });

  return Response.json({
    success: true,
    message: 'Profile picture updated successfully',
    data: { photo_url: dataUrl },
  });
}