import { NextRequest } from 'next/server';
import { verifyAccessToken } from './jwt';
import { prisma } from './prisma';
import { resolveContractorIdForUser } from './auth';
import { hasPermission } from './rbac';

export interface MobileAuthResult {
  authenticated: boolean;
  userId: string | null;
  contractorId: string | null;
  companyId: string | null;
  siteId: string | null;
  user: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    avatar: string | null;
    role: string;
  } | null;
}

export async function mobileAuth(request: NextRequest): Promise<MobileAuthResult> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return { authenticated: false, userId: null, contractorId: null, companyId: null, siteId: null, user: null };
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return { authenticated: false, userId: null, contractorId: null, companyId: null, siteId: null, user: null };
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { contractor: true, teamMember: true },
  });

  if (!user) {
    return { authenticated: false, userId: null, contractorId: null, companyId: null, siteId: null, user: null };
  }

  const contractorId = await resolveContractorIdForUser(user.id);
  const companyIdHeader = request.headers.get('company-id');
  const siteIdHeader = request.headers.get('site-id');

  return {
    authenticated: true,
    userId: user.id,
    contractorId,
    companyId: companyIdHeader || contractorId,
    siteId: siteIdHeader,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.teamMember?.phone || user.contractor?.phoneNumber || null,
      avatar: user.avatar,
      role: user.role,
    },
  };
}

export function cuidToInt(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function mobileSuccess(data: any, message?: string) {
  return Response.json({ error: false, message: message || 'Success', data }, { status: 200 });
}

export function mobileError(message: string, status: number = 400) {
  if (status === 401) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }
  return Response.json({ error: true, message }, { status });
}

export function mobileSuccessOk(data: any, message?: string) {
  const response: any = { success: true, data };
  if (message) response.message = message;
  return Response.json(response, { status: 200 });
}

export function mobileSuccessMsg(message: string) {
  return Response.json({ success: true, message }, { status: 200 });
}

export function mobileErrorOk(message: string, status: number = 400) {
  return Response.json({ success: false, message }, { status });
}

export function mobileListRows(rows: any[], total: number) {
  return Response.json({ rows, total }, { status: 200 });
}

export function mobileCountData(count: number, data: any[]) {
  return Response.json({ count, data }, { status: 200 });
}

export function mobileStatusSuccess(data: any) {
  return Response.json({ status: 'success', data }, { status: 200 });
}

// ---------------------------------------------------------------------------
// Mobile permission guards
// ---------------------------------------------------------------------------
// These mirror lib/require-permission.ts but use the mobile auth context
// (Authorization: Bearer header + company-id / site-id headers) and return
// mobile-shaped error responses ({ message: 'Unauthenticated.' } on 401).
// Permission checks reuse lib/rbac.ts so superadmin / "Contractor Admin"
// bypass rules stay identical to the web API.
// ---------------------------------------------------------------------------

export interface MobilePermissionResult {
  authorized: boolean;
  error?: Response;
  userId?: string;
  contractorId?: string | null;
  companyId?: string | null;
  siteId?: string | null;
  user?: MobileAuthResult['user'] | null;
}

export async function mobileRequirePermission(
  request: NextRequest,
  permission: string
): Promise<MobilePermissionResult> {
  const auth = await mobileAuth(request);
  if (!auth.authenticated || !auth.userId) {
    return { authorized: false, error: mobileError('Unauthenticated.', 401) as Response };
  }
  const ok = await hasPermission(auth.userId, permission);
  if (!ok) {
    return { authorized: false, error: mobileError('Forbidden. Missing permission: ' + permission, 403) as Response };
  }
  return {
    authorized: true,
    userId: auth.userId,
    contractorId: auth.contractorId,
    companyId: auth.companyId,
    siteId: auth.siteId,
    user: auth.user,
  };
}

export async function mobileRequireContractorPermission(
  request: NextRequest,
  permission: string
): Promise<MobilePermissionResult> {
  const auth = await mobileAuth(request);
  if (!auth.authenticated || !auth.userId) {
    return { authorized: false, error: mobileError('Unauthenticated.', 401) as Response };
  }
  if (!auth.contractorId) {
    return { authorized: false, error: mobileError('Contractor account required.', 403) as Response };
  }
  const ok = await hasPermission(auth.userId, permission);
  if (!ok) {
    return { authorized: false, error: mobileError('Forbidden. Missing permission: ' + permission, 403) as Response };
  }
  return {
    authorized: true,
    userId: auth.userId,
    contractorId: auth.contractorId,
    companyId: auth.companyId,
    siteId: auth.siteId,
    user: auth.user,
  };
}

export async function mobileRequireSuperadmin(
  request: NextRequest
): Promise<MobilePermissionResult> {
  const auth = await mobileAuth(request);
  if (!auth.authenticated || !auth.userId) {
    return { authorized: false, error: mobileError('Unauthenticated.', 401) as Response };
  }
  if (!auth.user || auth.user.role !== 'superadmin') {
    return { authorized: false, error: mobileError('Superadmin access required.', 403) as Response };
  }
  return {
    authorized: true,
    userId: auth.userId,
    contractorId: auth.contractorId,
    companyId: auth.companyId,
    siteId: auth.siteId,
    user: auth.user,
  };
}

// Convenience mobile response helpers for common shapes ----------------------

export function mobileCreated(data: any, message?: string) {
  return Response.json({ error: false, message: message || 'Created successfully', data }, { status: 201 });
}

export function mobileList(rows: any[], total: number, pagination?: { page: number; limit: number; pages: number }) {
  const body: any = { rows, total };
  if (pagination) body.pagination = pagination;
  return Response.json({ error: false, message: 'Success', data: body }, { status: 200 });
}