import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from './auth-middleware';
import { prisma } from './prisma';

export interface PermissionCheckResult {
  authorized: boolean;
  error?: NextResponse;
  userId?: string;
  contractorId?: string;
}

async function checkUserPermission(userId: string, permissionName: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      roleRelation: {
        select: {
          name: true,
          permissions: { select: { name: true } }
        }
      }
    }
  });

  if (!user) return false;
  if (user.role === 'superadmin') return true;
  if (!user.roleRelation) return false;

  // Contractor Admin role gets all permissions
  if (user.roleRelation.name === 'Contractor Admin') return true;

  return user.roleRelation.permissions.some(p => p.name === permissionName);
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

  const hasPermission = await checkUserPermission(auth.userId, permission);
  if (!hasPermission) {
    return {
      authorized: false,
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return {
    authorized: true,
    userId: auth.userId,
    contractorId: auth.contractorId || undefined,
  };
}

export async function requireContractorPermission(
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

  if (!auth.contractorId) {
    return {
      authorized: false,
      error: NextResponse.json({ error: 'Contractor account required' }, { status: 403 }),
    };
  }

  const hasPermission = await checkUserPermission(auth.userId, permission);
  if (!hasPermission) {
    return {
      authorized: false,
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
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

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true },
  });

  if (!user || user.role !== 'superadmin') {
    return {
      authorized: false,
      error: NextResponse.json({ error: 'Superadmin access required' }, { status: 403 }),
    };
  }

  return {
    authorized: true,
    userId: auth.userId,
    contractorId: auth.contractorId || undefined,
  };
}