import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { hasPermission } from '@/lib/rbac';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!await hasPermission(user?.id || '', 'workers:read')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const contractorId = searchParams.get('contractorId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where = {
      ...(contractorId ? { contractorId } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
          { nationalId: { contains: search } },
        ]
      } : {})
    };

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
    const user = await getCurrentUser();
    if (!await hasPermission(user?.id || '', 'workers:create')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();

    // Use user's contractorId if available, otherwise from body or fallback
    let contractorId = user?.contractor?.id || user?.teamMember?.contractorId || body.contractorId;
    
    if (!contractorId || contractorId === 'placeholder-id') {
      const firstContractor = await prisma.contractor.findFirst();
      contractorId = firstContractor?.id;
    }

    if (!contractorId) {
      return NextResponse.json({ error: 'Contractor ID required' }, { status: 400 });
    }

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
      userId: user?.id || 'system',
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
