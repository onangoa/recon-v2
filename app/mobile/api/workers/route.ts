import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
  mobileList,
} from '@/lib/mobile-auth';
import { getDeviceEnrollIds } from '@/lib/biometric-service';
import { nextFreeEnrollId } from '@/lib/enroll-id';

export async function GET(request: NextRequest) {
  try {
    const permCheck = await mobileRequirePermission(request, 'workers:read');
    if (!permCheck.authorized) return permCheck.error!;

    const contractorId = permCheck.contractorId;
    if (!contractorId) {
      return mobileError('Contractor account required', 403);
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = { contractorId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { nationalId: { contains: search } },
      ];
    }

    const [workers, total] = await Promise.all([
      prisma.worker.findMany({
        where,
        include: { designation: true, shift: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.worker.count({ where }),
    ]);

    return mobileList(workers, total, {
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Mobile fetch workers error:', error);
    return mobileError('Failed to fetch workers', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const permCheck = await mobileRequirePermission(request, 'workers:create');
    if (!permCheck.authorized) return permCheck.error!;

    const contractorId = permCheck.contractorId;
    if (!contractorId) {
      return mobileError('Contractor account required', 403);
    }

    const body = await request.json();

    let designationId = body.designationId;
    if (designationId === '' || designationId === 'null' || designationId === 'undefined') {
      designationId = null;
    }

    // System-assigned Enroll ID: when blank, fill the first free slot for the
    // target device (enroll IDs are unique per device, e.g. 1,2,3,10 taken -> 4).
    let enrollId = body.enrollId;
    if (enrollId === undefined || enrollId === null || String(enrollId).trim() === '') {
      enrollId = null;
      let sn = body.deviceSn || null;
      if (!sn) {
        const first = await prisma.biometricDevice.findFirst({
          where: { contractorId, isActive: true },
          orderBy: { createdAt: 'desc' },
        });
        sn = first?.sn || null;
      }
      if (sn) {
        try {
          const taken = await getDeviceEnrollIds(sn);
          enrollId = String(nextFreeEnrollId(taken));
        } catch {
          enrollId = null;
        }
      }
    }

    const worker = await prisma.worker.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        nationalId: body.nationalId,
        enrollId,
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

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId: contractorId,
      action: 'CREATE',
      module: 'WORKERS',
      description: `Added new worker: ${worker.name}`,
      targetId: worker.id,
      details: { name: worker.name, designation: worker.designation?.title },
    });

    return mobileSuccess(worker, 'Worker created');
  } catch (error) {
    console.error('Mobile create worker error:', error);
    return mobileError('Failed to create worker', 500);
  }
}
