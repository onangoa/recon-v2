import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

function requireSecret(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is required. Set it in your .env file.`);
  }
  return value;
}

const ACCESS_TOKEN_SECRET = requireSecret('JWT_SECRET');
const REFRESH_TOKEN_SECRET = requireSecret('JWT_REFRESH_SECRET');
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
  contractorId: string | null;
}

export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as AccessTokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function saveRefreshToken(userId: string, token: string) {
  const decoded = jwt.decode(token) as { exp: number };
  const expiresAt = new Date(decoded.exp * 1000);

  await prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });
}

export async function revokeRefreshToken(token: string) {
  await prisma.refreshToken.updateMany({
    where: { token },
    data: { isRevoked: true },
  });
}

export async function revokeAllUserRefreshTokens(userId: string) {
  await prisma.refreshToken.updateMany({
    where: { userId },
    data: { isRevoked: true },
  });
}

export async function isRefreshTokenValid(token: string): Promise<boolean> {
  const record = await prisma.refreshToken.findUnique({
    where: { token },
  });

  if (!record) return false;
  if (record.isRevoked) return false;
  if (record.expiresAt < new Date()) return false;

  return true;
}

export async function isRefreshTokenExpiredOrMissing(token: string): Promise<boolean> {
  const record = await prisma.refreshToken.findUnique({ where: { token } });
  if (!record) return true;
  if (record.expiresAt < new Date()) return true;
  return false;
}

export async function getLatestValidRefreshTokenForUser(userId: string): Promise<{ token: string } | null> {
  const record = await prisma.refreshToken.findFirst({
    where: {
      userId,
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
  return record ? { token: record.token } : null;
}

export async function deleteExpiredRefreshTokens() {
  await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}