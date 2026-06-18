import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, session: any) => Promise<NextResponse>
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return handler(request, session);
}

export async function withContractorAuth(
  request: NextRequest,
  handler: (request: NextRequest, session: any) => Promise<NextResponse>
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (!session.user.contractor) {
    return NextResponse.json(
      { error: 'Contractor account required' },
      { status: 403 }
    );
  }

  return handler(request, session);
}

export async function checkClientAuth(request: NextRequest): Promise<{ authenticated: boolean; session: any | null }> {
  try {
    const sessionId = request.cookies.get('sessionId')?.value;

    if (!sessionId) {
      return { authenticated: false, session: null };
    }

    const { prisma } = await import('@/lib/prisma');
    
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          include: { contractor: true }
        }
      }
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: sessionId } });
      }
      return { authenticated: false, session: null };
    }

    return { authenticated: true, session };
  } catch (error) {
    console.error('Auth check error:', error);
    return { authenticated: false, session: null };
  }
}