import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  if (!auth.userId) return mobileError('User not found', 404);

  const formData = await request.formData();
  const file = formData.get('profile_image') as File | null;
  if (!file) return mobileError('No image uploaded', 400);

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString('base64');
  const mimeType = file.type || 'image/jpeg';
  const dataUrl = `data:${mimeType};base64,${base64}`;

  await prisma.user.update({
    where: { id: auth.userId },
    data: { avatar: dataUrl },
  });

  return mobileSuccess({ avatar: dataUrl }, 'Profile picture updated successfully');
}