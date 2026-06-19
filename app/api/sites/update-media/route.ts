import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const body = await request.json();
  const { media_id, caption } = body;

  if (!media_id) return mobileError('media_id is required', 400);

  const photo = await prisma.photo.findUnique({ where: { id: media_id } });
  if (!photo) return mobileError('Media not found', 404);

  const updated = await prisma.photo.update({
    where: { id: media_id },
    data: { caption: caption ?? photo.caption },
  });

  return mobileSuccess({
    id: updated.id,
    caption: updated.caption,
  }, 'Media updated successfully');
}