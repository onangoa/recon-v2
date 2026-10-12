import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { requireContractorPermission } from '@/lib/require-permission';

export async function POST(request: NextRequest) {
  const permCheck = await requireContractorPermission(request, 'workers:delete');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;
  try {
    const body = await request.json();
    const ids: string[] = Array.isArray(body.ids) ? body.ids.filter((id: any) => id) : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: 'No workers selected' }, { status: 400 });
    }

    // Only delete workers that belong to this contractor — foreign ids are
    // silently filtered out so the count reflects what was actually removed.
    const owned = await prisma.worker.findMany({
      where: { id: { in: ids }, contractorId },
      select: { id: true, name: true },
    });

    if (owned.length === 0) {
      return NextResponse.json({ error: 'Workers not found' }, { status: 404 });
    }

    await prisma.worker.deleteMany({
      where: { id: { in: owned.map((w) => w.id) } },
    });

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId,
      action: 'DELETE',
      module: 'WORKERS',
      description: `Bulk deleted ${owned.length} worker(s): ${owned.map((w) => w.name).join(', ')}`,
      details: { count: owned.length, names: owned.map((w) => w.name) },
    });

    return NextResponse.json({
      message: `${owned.length} worker(s) deleted`,
      deletedCount: owned.length,
      notFoundCount: ids.length - owned.length,
    });
  } catch (error) {
    console.error('Failed to bulk delete workers:', error);
    return NextResponse.json({ error: 'Failed to delete workers' }, { status: 500 });
  }
}
