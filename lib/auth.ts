import { cookies } from 'next/headers';
import { verifyAccessToken, AccessTokenPayload } from './jwt';
import { prisma } from './prisma';

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar: string | null;
  };
  contractor: {
    id: string;
    companyName: string;
    location: string;
    phoneNumber: string;
    licenseNo: string;
    userId: string;
  } | null;
  payload: AccessTokenPayload;
}

export async function getAccessTokenFromRequest(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (token) return token;

  const authHeader = cookieStore.get('authorization')?.value;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

export async function getSession(): Promise<AuthSession | null> {
  try {
    const token = await getAccessTokenFromRequest();
    if (!token) return null;

    const payload = verifyAccessToken(token);
    if (!payload) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { contractor: true, teamMember: true },
    });

    if (!user) return null;

    const contractor = await resolveContractorForUser(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
      contractor: contractor ? {
        id: contractor.id,
        companyName: contractor.companyName,
        location: contractor.location,
        phoneNumber: contractor.phoneNumber,
        licenseNo: contractor.licenseNo,
        userId: contractor.userId,
      } : null,
      payload,
    };
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

export async function getCurrentContractor() {
  const session = await getSession();
  return session?.contractor || null;
}

export async function resolveContractorForUser(userId: string): Promise<{
  id: string;
  companyName: string;
  location: string;
  phoneNumber: string;
  licenseNo: string;
  userId: string;
} | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { contractor: true, teamMember: true },
  });

  if (!user) return null;

  if (user.contractor) {
    return {
      id: user.contractor.id,
      companyName: user.contractor.companyName,
      location: user.contractor.location,
      phoneNumber: user.contractor.phoneNumber,
      licenseNo: user.contractor.licenseNo,
      userId: user.contractor.userId,
    };
  }

  if (user.teamMember?.contractorId) {
    const contractor = await prisma.contractor.findUnique({
      where: { id: user.teamMember.contractorId },
    });
    if (contractor) {
      return {
        id: contractor.id,
        companyName: contractor.companyName,
        location: contractor.location,
        phoneNumber: contractor.phoneNumber,
        licenseNo: contractor.licenseNo,
        userId: contractor.userId,
      };
    }
  }

  return null;
}

export async function resolveContractorIdForUser(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { contractor: { select: { id: true } }, teamMember: { select: { contractorId: true } } },
  });

  if (!user) return null;

  if (user.contractor) return user.contractor.id;
  if (user.teamMember?.contractorId) return user.teamMember.contractorId;
  return null;
}

export async function requireAuth(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireContractorAuth(): Promise<AuthSession> {
  const session = await requireAuth();
  if (!session.contractor) {
    throw new Error('Contractor account required');
  }
  return session;
}