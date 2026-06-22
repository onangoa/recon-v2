import { NextRequest } from 'next/server';
import { mobileAuth } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await mobileAuth(request);
  if (!auth.authenticated) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }

  const contractorId = auth.contractorId || auth.companyId;
  if (!contractorId) return Response.json({ error: true, message: 'Company not found.' }, { status: 400 });

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

  return Response.json({
    error: false,
    message: 'Activity logs retrieved successfully',
    data: logs.map(l => ({
      id: l.id,
      actor_id: l.user?.id || null,
      actor_name: l.user?.name || 'System',
      actor_type: l.user ? 'user' : 'system',
      type_id: l.targetId || null,
      parent_type_id: null,
      type: l.module || l.action,
      parent_type: null,
      type_title: l.module || null,
      parent_type_title: null,
      activity: l.action,
      message: l.description || l.action,
      created_at: l.createdAt,
      updated_at: l.updatedAt,
    })),
    total,
  });
}