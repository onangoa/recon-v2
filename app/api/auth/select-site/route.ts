import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId } = body;

    const sessionId = request.cookies.get('sessionId')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          include: { contractor: true }
        }
      }
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    if (!session.user.contractor) {
      return NextResponse.json(
        { error: 'User has no contractor' },
        { status: 400 }
      );
    }

    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        contractorId: session.user.contractor.id,
      }
    });

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Site selected',
      siteId,
    });
  } catch (error) {
    console.error('Select site error:', error);
    return NextResponse.json(
      { error: 'Failed to select site' },
      { status: 500 }
    );
  }
}