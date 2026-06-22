import { NextRequest } from 'next/server';
import { mobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }
  const { id } = await params;

  const license = await prisma.license.findUnique({ where: { id } });
  if (!license) return Response.json({ error: true, message: 'License not found.' }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get('document_path') as File | null;
  if (!file) return Response.json({ error: true, message: 'No file uploaded.' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString('base64');

  const updated = await prisma.license.update({
    where: { id },
    data: {
      fileName: file.name,
      fileData: base64,
    },
  });

  return Response.json({
    error: false,
    message: 'File uploaded successfully.',
    file: { name: file.name, url: `/api/licenses/${id}/file`, size: file.size },
    data: { id: updated.id, license_number: updated.licenseNumber, document_path: updated.fileName },
  });
}