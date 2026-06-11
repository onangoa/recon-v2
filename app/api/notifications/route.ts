import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // In a real app, get userId from session
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json([]);

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json(notifications);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, isRead } = await request.json();
    
    if (id === 'all') {
      const user = await prisma.user.findFirst();
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true }
      });
    } else {
      await prisma.notification.update({
        where: { id },
        data: { isRead }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
