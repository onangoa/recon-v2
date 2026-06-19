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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const baseWhere = search ? {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { nationalId: { contains: search } },
      ]
    } : {};

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

    return NextResponse.json({
      workers,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
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
