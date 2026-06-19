import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id: siteId } = await params;

  const isApi = request.nextUrl.searchParams.get('isApi') === '1';

  const photos = await prisma.photo.findMany({
    where: { siteId },
    orderBy: { createdAt: 'desc' },
  });

  return mobileSuccess(photos.map(p => ({
    id: p.id,
    site_id: p.siteId,
    image_url: p.imageUrl,
    caption: p.caption,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  })));
}