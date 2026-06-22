import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from './auth-middleware';

export interface PermissionCheckResult {
  authorized: boolean;
  error?: NextResponse;
  userId?: string;
  contractorId?: string;
}

export async function requirePermission(
  request: NextRequest,
  _permission: string
): Promise<PermissionCheckResult> {
  const auth = await verifyAuth(request);

  if (!auth.authenticated || !auth.userId) {
    return {
      authorized: false,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
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

  return {
    authorized: true,
    userId: auth.userId,
    contractorId: auth.contractorId,
  };
}