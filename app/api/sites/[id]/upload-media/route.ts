import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id: siteId } = await params;

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) return mobileError('Site not found', 404);

  const formData = await request.formData();
  const files = formData.getAll('media_files[]') as File[];
  const singleFile = formData.get('photo') as File | null;
  const file = files.length > 0 ? files[0] : singleFile;

  if (!file) return mobileError('No file uploaded', 400);

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString('base64');
  const mimeType = file.type || 'image/jpeg';
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const title = (formData.get('title') as string) || null;
  const notes = (formData.get('notes') as string) || null;

  const photo = await prisma.photo.create({
    data: {
      siteId,
      imageUrl: dataUrl,
      caption: title || notes || file.name,
    },
  });

  return mobileSuccess({
    id: photo.id,
    site_id: photo.siteId,
    image_url: photo.imageUrl,
    caption: photo.caption,
  }, 'Media uploaded successfully');
}