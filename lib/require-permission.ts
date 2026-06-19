import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from './auth-middleware';
import { hasPermission } from './rbac';

export interface PermissionCheckResult {
  authorized: boolean;
  error?: NextResponse;
  userId?: string;
  contractorId?: string;
}

export async function requirePermission(
  request: NextRequest,
  permission: string
): Promise<PermissionCheckResult> {
  const auth = await verifyAuth(request);

  if (!auth.authenticated || !auth.userId) {
    return {
      authorized: false,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const permitted = await hasPermission(auth.userId, permission);
  if (!permitted) {
    return {
      authorized: false,
      error: NextResponse.json({ error: 'Permission denied' }, { status: 403 }),
    };
  }

  return {
    authorized: true,
    userId: auth.userId,
    contractorId: auth.contractorId,
  };
}

export async function requireSuperadmin(
  request: NextRequest
): Promise<PermissionCheckResult> {
  const auth = await verifyAuth(request);

  if (!auth.authenticated || !auth.userId) {
    return {
      authorized: false,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const user = await import('./prisma').then(m => m.prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true },
  }));

  if (!user || user.role !== 'superadmin') {
    return {
      authorized: false,
      error: NextResponse.json({ error: 'Superadmin access required' }, { status: 403 }),
    };
  }

  return {
    authorized: true,
    userId: auth.userId,
    contractorId: auth.contractorId,
  };
}