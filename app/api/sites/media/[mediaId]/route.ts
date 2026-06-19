import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ mediaId: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { mediaId } = await params;

  const photo = await prisma.photo.findUnique({ where: { id: mediaId } });
  if (!photo) return mobileError('Media not found', 404);

  await prisma.photo.delete({ where: { id: mediaId } });

  return mobileSuccess(null, 'Media deleted successfully');
}