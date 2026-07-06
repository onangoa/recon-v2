import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { hashPassword } from '@/lib/jwt';
import {
  mobileRequireSuperadmin,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  const permCheck = await mobileRequireSuperadmin(request);
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'superadmin' },
      orderBy: { createdAt: 'desc' },
    });
    return mobileSuccess(admins);
  } catch (error) {
    return mobileError('Failed to fetch admins', 500);
  }
}

export async function POST(request: NextRequest) {
  const permCheck = await mobileRequireSuperadmin(request);
  if (!permCheck.authorized) return permCheck.error!;
  try {
    const body = await request.json();
    const { name, email, password } = body;

    const plainPassword = password || crypto.randomBytes(8).toString('hex');

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: await hashPassword(plainPassword),
        role: 'superadmin',
      },
    });

    return mobileSuccess(admin, 'Admin created');
  } catch (error) {
    return mobileError('Failed to create admin', 500);
  }
}
