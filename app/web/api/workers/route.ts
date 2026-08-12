import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { requirePermission } from '@/lib/require-permission';
import { getCurrentContractor } from '@/lib/auth';
import { withContractorFilter } from '@/lib/contractor-isolation';

export async function GET(request: NextRequest) {
  try {
    const permCheck = await requirePermission(request, 'workers:read');
    if (!permCheck.authorized) return permCheck.error;

    const contractor = await getCurrentContractor();
    if (!contractor) {
      return NextResponse.json({ error: 'Contractor account required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const designationId = searchParams.get('designationId');
    const unassigned = searchParams.get('unassigned');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const baseWhere: any = {};
    if (search) {
      baseWhere.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { nationalId: { contains: search } },
      ];
    }
    if (designationId) {
      baseWhere.designationId = designationId;
    }
    if (unassigned === '1' || unassigned === 'true') {
      baseWhere.designationId = null;
    }

    const where = withContractorFilter({ where: baseWhere }, contractor.id).where;

    const [workers, total] = await Promise.all([
      prisma.worker.findMany({
        where,
        include: { designation: true, shift: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.worker.count({ where })
    ]);

    // Aggregated stats across ALL the contractor's workers (independent of search/filter/pagination).
    const statsWhere = { contractorId: contractor.id };
    const [byDesigGroup, totalActiveCount] = await Promise.all([
      prisma.worker.groupBy({
        by: ['designationId'],
        where: statsWhere,
        _count: { _all: true },
      }),
      prisma.worker.count({ where: { ...statsWhere, status: 'Active' } }),
    ]);
    const desigIds = byDesigGroup.map((g) => g.designationId).filter((d): d is string => d !== null);
    const desigs = desigIds.length
      ? await prisma.designation.findMany({ where: { id: { in: desigIds } }, select: { id: true, title: true } })
      : [];
    const titleMap = new Map(desigs.map((d) => [d.id, d.title]));
    const byDesignation = byDesigGroup
      .map((g) => ({
        designationId: g.designationId,
        title: g.designationId ? (titleMap.get(g.designationId) || 'Unknown') : 'Unassigned',
        count: g._count._all,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      workers,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      },
      stats: {
        totalActive: totalActiveCount,
        byDesignation,
      },
    });
  } catch (error) {
    console.error('Failed to fetch workers:', error);
    return NextResponse.json({ error: 'Failed to fetch workers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const permCheck = await requirePermission(request, 'workers:create');
    if (!permCheck.authorized) return permCheck.error;

    const contractor = await getCurrentContractor();
    if (!contractor) {
      return NextResponse.json({ error: 'Contractor account required' }, { status: 403 });
    }

    const body = await request.json();
    const contractorId = contractor.id;

    // Handle empty or invalid designationId
    let designationId = body.designationId;
    if (designationId === "" || designationId === "null" || designationId === "undefined") {
      designationId = null;
    }

    const worker = await prisma.worker.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        nationalId: body.nationalId,
        enrollId: body.enrollId || null,
        designationId: designationId,
        shiftId: body.shiftId || null,
        paymentMode: body.paymentMode || 'manual',
        paymentPhone: body.paymentPhone || null,
        paymentAccount: body.paymentAccount || null,
        contractorId: contractorId,
        status: body.status || 'Active',
        joinedAt: body.joinedAt ? new Date(body.joinedAt) : undefined,
        idDocumentUrl: body.idDocumentUrl || null,
      },
      include: {
        designation: true,
        shift: true,
      },
    });

    // Record activity log
    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId: contractorId,
      action: 'CREATE',
      module: 'WORKERS',
      description: `Added new worker: ${worker.name}`,
      targetId: worker.id,
      details: { name: worker.name, designation: worker.designation?.title }
    });

    return NextResponse.json(worker, { status: 201 });
  } catch (error) {
    console.error('Failed to create worker:', error);
    return NextResponse.json({ error: 'Failed to create worker' }, { status: 500 });
  }
}
