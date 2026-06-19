import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { requireSuperadmin } from '@/lib/require-permission';

export async function GET(request: Request) {
  const adminCheck = await requireSuperadmin(request);
  if (!adminCheck.authorized) return adminCheck.error;
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'superadmin' },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(admins);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const adminCheck = await requireSuperadmin(request);
  if (!adminCheck.authorized) return adminCheck.error;
  try {
    const body = await request.json();
    const { name, email, password } = body;

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: password || crypto.randomBytes(8).toString('hex'),
        role: 'superadmin',
      },
    });

    return NextResponse.json(admin);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
  }
}
