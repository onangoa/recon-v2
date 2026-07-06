import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function POST(request: NextRequest) {
  const permCheck = await mobileRequirePermission(request, 'documents:create');
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return mobileError('No file provided', 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `${uniqueSuffix}-${file.name}`;
    const filepath = join(uploadsDir, filename);

    await writeFile(filepath, buffer);

    return mobileSuccess({
      url: `/uploads/${filename}`,
      fileData: `/uploads/${filename}`,
      fileName: file.name,
      fileType: file.type,
    }, 'File uploaded');
  } catch (error) {
    console.error('Failed to upload file:', error);
    return mobileError('Failed to upload file', 500);
  }
}
