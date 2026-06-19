import { NextRequest } from 'next/server';
import { verifyAccessToken } from './jwt';
import { prisma } from './prisma';
import { resolveContractorIdForUser } from './auth';

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

export function mobileSuccess(data: any, message?: string) {
  return Response.json({ error: false, message: message || 'Success', data }, { status: 200 });
}

export function mobileError(message: string, status: number = 400) {
  if (status === 401) {
    return Response.json({ message: 'Unauthenticated.', error: 'Unauthenticated' }, { status: 401 });
  }
  return Response.json({ message, error: message }, { status });
}