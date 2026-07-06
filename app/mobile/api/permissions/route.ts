import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  try {
    const permCheck = await mobileRequirePermission(request, 'roles:read');
    if (!permCheck.authorized) return permCheck.error!;

    const permissions = await prisma.permission.findMany({
      orderBy: [
        { module: 'asc' },
        { action: 'asc' }
      ]
    });

    return mobileSuccess(permissions);
  } catch (error) {
    console.error('Failed to fetch permissions:', error);
    return mobileError('Failed to fetch permissions', 500);
  }
}
