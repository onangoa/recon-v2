import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('sessionId')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    // Get session with user and contractor details before deleting
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: { include: { contractor: true } } }
    });

    if (session) {
      // Log logout activity if contractor exists
      if (session.user.contractor) {
        await ActivityLogger.log({
          userId: session.user.id,
          contractorId: session.user.contractor.id,
          action: 'LOGOUT',
          module: 'SETTINGS',
          description: `${session.user.name} logged out`,
        });
      }
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
