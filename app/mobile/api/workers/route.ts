import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import {
  mobileRequirePermission,
  mobileSuccess,
  mobileError,
  mobileList,
} from '@/lib/mobile-auth';
import {
  normalizeShiftIdsInput,
  validateShiftOwnership,
  withShiftsArray,
  workerShiftInclude,
} from '@/lib/worker-shifts';
import { verifySiteOwnership } from '@/lib/contractor-isolation';

/** Include clause for the worker's enrolled site (flat list responses). */
const siteInclude = { site: { select: { id: true, name: true } } };

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
        include: { designation: true, shift: true, ...siteInclude, ...workerShiftInclude },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.worker.count({ where }),
    ]);

    return mobileList(workers.map(withShiftsArray), total, {
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

    // Note: the Enroll ID is not set here — it is assigned server-side by
    // /web/api/biometric/enroll when the worker is enrolled to a device
    // (unique per device, first free slot).

    const shiftIds = normalizeShiftIdsInput(body) || [];
    const ownedShiftIds = await validateShiftOwnership(shiftIds, contractorId);
    if (ownedShiftIds === null) {
      return mobileError('Invalid shift ID', 400);
    }

    // Workers are enrolled per site: an explicit siteId (or the request's
    // site-id header) must belong to the contractor; otherwise the
    // contractor's primary site (or first site) is used.
    let siteId: string | null = body.siteId
      ? String(body.siteId)
      : permCheck.siteId || null;
    if (siteId) {
      const owns = await verifySiteOwnership(contractorId, siteId);
      if (!owns) {
        return mobileError('Invalid site ID', 400);
      }
    } else {
      const fallbackSite = await prisma.site.findFirst({
        where: { contractorId },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        select: { id: true },
      });
      siteId = fallbackSite?.id ?? null;
    }

    // National ID must be unique within the contractor's account. Checked
    // up front so the user gets a named, actionable message instead of a
    // raw unique-constraint error.
    const nationalId = body.nationalId ? String(body.nationalId).trim() : null;
    if (nationalId) {
      const existing = await prisma.worker.findFirst({
        where: { nationalId, contractorId },
        select: { name: true, status: true },
      });
      if (existing) {
        return mobileError(
          `National ID ${nationalId} is already registered to "${existing.name}" in your account. Every worker must have a unique National ID — search for it in your Workers list to update or remove that entry first.`,
          409
        );
      }
    }

    const worker = await prisma.worker.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        nationalId,
        enrollId: body.enrollId || null,
        designationId: designationId,
        siteId,
        shiftId: ownedShiftIds[0] || null,
        workerShifts: {
          create: ownedShiftIds.map((shiftId) => ({ shiftId })),
        },
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
        ...siteInclude,
        ...workerShiftInclude,
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

    return mobileSuccess(withShiftsArray(worker), 'Worker created');
  } catch (error: any) {
    // Race fallback: another request claimed the National ID between the
    // pre-check and the insert.
    if (error?.code === 'P2002' && String(error?.meta?.target || '').includes('nationalId')) {
      return mobileError('National ID is already used by another worker in your account.', 409);
    }
    console.error('Mobile create worker error:', error);
    return mobileError('Failed to create worker', 500);
  }
}
