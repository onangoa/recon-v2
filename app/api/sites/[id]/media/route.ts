import { NextRequest } from 'next/server';
import { mobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }
  const { id: siteId } = await params;

  const photos = await prisma.photo.findMany({
    where: { siteId },
    orderBy: { createdAt: 'desc' },
  });

  return Response.json({
    error: false,
    message: 'Media retrieved successfully.',
    data: photos.map(p => ({
      id: p.id,
      file: p.imageUrl,
      file_name: p.caption || '',
      title: p.caption,
      notes: '',
      file_size: '',
      created_at: p.createdAt,
      updated_at: p.updatedAt,
      actions: '',
    })),
  });
}