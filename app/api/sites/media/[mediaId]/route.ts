import { NextRequest } from 'next/server';
import { mobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ mediaId: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }
  const { mediaId } = await params;

  const photo = await prisma.photo.findUnique({ where: { id: mediaId } });
  if (!photo) return Response.json({ error: true, message: 'Media not found' }, { status: 404 });

  const siteId = photo.siteId;
  await prisma.photo.delete({ where: { id: mediaId } });

  return Response.json({
    error: false,
    message: 'Media deleted successfully.',
    id: mediaId,
    title: photo.caption || '',
    parent_id: siteId,
    type: 'media',
    parent_type: 'site',
  });
}