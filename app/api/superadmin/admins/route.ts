import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET() {
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
