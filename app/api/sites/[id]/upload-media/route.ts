import { NextRequest } from 'next/server';
import { mobileAuth, cuidToInt } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }
  const { id: siteId } = await params;

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) return Response.json({ error: true, message: 'Site not found.' }, { status: 404 });

  const formData = await request.formData();
  const files = formData.getAll('media_files[]') as File[];
  const singleFile = formData.get('photo') as File | null;
  const file = files.length > 0 ? files[0] : singleFile;

  if (!file) return Response.json({ error: true, message: 'No file(s) chosen.' });

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

  return Response.json({
    error: false,
    message: 'Media uploaded successfully.',
    id: [photo.id],
    data: [{
      id: photo.id,
      file: photo.imageUrl,
      file_name: file.name,
      title: photo.caption,
      notes: notes || '',
      file_size: String(file.size),
      created_at: photo.createdAt,
      updated_at: photo.updatedAt,
      actions: '',
    }],
  });
}