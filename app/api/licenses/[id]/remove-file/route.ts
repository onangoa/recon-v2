import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);
  const { id } = await params;

  const license = await prisma.license.findUnique({ where: { id } });
  if (!license) return mobileError('License not found', 404);

  await prisma.license.update({
    where: { id },
    data: { fileName: null, fileData: null },
  });

  return mobileSuccess(null, 'File removed successfully');
}