import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, AccessTokenPayload } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { verifyContractorAccess } from '@/lib/contractor-isolation';

export interface AuthResult {
  authenticated: boolean;
  payload: AccessTokenPayload | null;
  userId: string | null;
  contractorId: string | null;
}

export interface ContractorAuthResult extends AuthResult {
  hasAccess: boolean;
}

function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  const cookieToken = request.cookies.get('accessToken')?.value;
  if (cookieToken) return cookieToken;

  return null;
}

export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  const token = extractToken(request);

  if (!token) {
    return { authenticated: false, payload: null, userId: null, contractorId: null };
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return { authenticated: false, payload: null, userId: null, contractorId: null };
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { contractor: { select: { id: true } } },
  });

  if (!user) {
    return { authenticated: false, payload: null, userId: null, contractorId: null };
  }

  return {
    authenticated: true,
    payload,
    userId: payload.userId,
    contractorId: payload.contractorId,
  };
}

export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, auth: AuthResult) => Promise<NextResponse>
) {
  const auth = await verifyAuth(request);

  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return handler(request, auth);
}

export async function withContractorAuth(
  request: NextRequest,
  handler: (request: NextRequest, auth: AuthResult) => Promise<NextResponse>
) {
  const auth = await verifyAuth(request);

  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!auth.contractorId) {
    return NextResponse.json({ error: 'Contractor account required' }, { status: 403 });
  }

  return handler(request, auth);
}

/**
 * Verify contractor access to specific resources
 */
export async function withResourceAccess(
  request: NextRequest,
  resourceType: string,
  resourceId: string,
  handler: (request: NextRequest, auth: AuthResult) => Promise<NextResponse>
) {
  const auth = await verifyAuth(request);

  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!auth.contractorId) {
    return NextResponse.json({ error: 'Contractor account required' }, { status: 403 });
  }

  const hasAccess = await verifyContractorAccess(auth.contractorId, resourceType, resourceId);

  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied - resource not found' }, { status: 404 });
  }

  return handler(request, auth);
}

/**
 * Verify contractor access to multiple resources
 */
export async function withBatchResourceAccess(
  request: NextRequest,
  resources: Array<{ type: string; id: string }>,
  handler: (request: NextRequest, auth: AuthResult) => Promise<NextResponse>
) {
  const auth = await verifyAuth(request);

  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!auth.contractorId) {
    return NextResponse.json({ error: 'Contractor account required' }, { status: 403 });
  }

  const accessChecks = await Promise.all(
    resources.map(resource => 
      verifyContractorAccess(auth.contractorId!, resource.type, resource.id)
    )
  );

  if (!accessChecks.every(hasAccess => hasAccess)) {
    return NextResponse.json({ error: 'Access denied - one or more resources not found' }, { status: 404 });
  }

  return handler(request, auth);
}