import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id } = await params;

  const license = await prisma.license.findUnique({ where: { id } });
  if (!license) return mobileError('License not found', 404);

  const formData = await request.formData();
  const file = formData.get('document_path') as File | null;
  if (!file) return mobileError('No file uploaded', 400);

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString('base64');

  const updated = await prisma.license.update({
    where: { id },
    data: {
      fileName: file.name,
      fileData: base64,
    },
  });

  return mobileSuccess({
    id: updated.id,
    file_name: updated.fileName,
    has_file: true,
  }, 'File uploaded successfully');
}