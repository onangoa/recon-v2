import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('sessionId')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    // Delete session
    await prisma.session.delete({
      where: { id: sessionId },
    });

    const response = NextResponse.json({
      message: 'Logout successful',
    });

    response.cookies.set('sessionId', '', {
      maxAge: 0,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
