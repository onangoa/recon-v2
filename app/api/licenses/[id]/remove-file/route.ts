import { NextRequest } from 'next/server';
import { mobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }
  const { id } = await params;

  const license = await prisma.license.findUnique({ where: { id } });
  if (!license) return Response.json({ error: true, message: 'License not found.' }, { status: 404 });

  if (!license.fileName && !license.fileData) {
    return Response.json({ error: true, message: 'No file to remove.' }, { status: 400 });
  }

  await prisma.license.update({
    where: { id },
    data: { fileName: null, fileData: null },
  });

  return Response.json({
    error: false,
    message: 'File removed successfully.',
    data: { id: license.id, license_number: license.licenseNumber, document_path: null },
  });
}