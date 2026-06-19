import { NextRequest } from 'next/server';
import { mobileAuth, mobileError, mobileSuccess } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) return mobileError('Unauthenticated', 401);

  const contractorId = auth.contractorId || auth.companyId;
  if (!contractorId) return mobileError('No company associated', 403);

  const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
  const module = request.nextUrl.searchParams.get('module') || '';
  const skip = (page - 1) * limit;

  const where: any = { contractorId };
  if (module) where.module = module;

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return mobileSuccess({
    data: logs.map(l => ({
      id: l.id,
      action: l.action,
      module: l.module,
      description: l.description,
      target_id: l.targetId,
      details: l.details,
      user: l.user,
      created_at: l.createdAt,
    })),
    meta: { page, limit, total },
  });
}