import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('sessionId')?.value;

    if (!sessionId) {
      const response = NextResponse.json({
        message: 'Logout successful',
      });
      
      response.cookies.set('sessionId', '', { maxAge: 0 });
      
      return response;
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: { include: { contractor: true } } }
    });

    if (session) {
      if (session.user.contractor) {
        await ActivityLogger.log({
          userId: session.user.id,
          contractorId: session.user.contractor.id,
          action: 'LOGOUT',
          module: 'SETTINGS',
          description: `${session.user.name} logged out`,
        });
      }

      await prisma.session.delete({
        where: { id: sessionId },
      });
    }

    const response = NextResponse.json({
      message: 'Logout successful',
    });

    response.cookies.set('sessionId', '', {
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    
    const response = NextResponse.json({
      message: 'Logout successful',
    });
    
    response.cookies.set('sessionId', '', {
      maxAge: 0,
      path: '/',
    });
    
    return response;
  }
}
