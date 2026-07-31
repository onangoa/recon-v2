import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireContractorPermission } from '@/lib/require-permission';
import { getUserList } from '@/lib/biometric-service';

/**
 * GET /web/api/biometric/users
 *
 * Returns the list of users enrolled on the biometric device (from
 * /api/getUserList) alongside the contractor's workers, marking which
 * workers are currently enrolled to the device.
 *
 * Response:
 *   {
 *     enrolledEnrollIds: number[],
 *     device: { sn, count, ... },
 *     workers: [{ id, name, enrollId, enrolled: boolean }]
 *   }
 */
export async function GET(request: NextRequest) {
  const permCheck = await requireContractorPermission(request, 'workers:read');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;

  try {
    // Fetch device user list + contractor workers. If the biometric API is
    // unavailable, we still return the workers with `enrolled: false`-ish
    // status so the UI keeps working.
    const workers = await prisma.worker.findMany({
      where: { contractorId },
      select: { id: true, name: true, enrollId: true, designation: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const sn = process.env.BIOMETRIC_DEVICE_SN || '';

    const enrolledEnrollIds: number[] = [];
    let deviceInfo: any = null;

    try {
      const list = await getUserList(null);
      if (list?.record) {
        for (const r of list.record) enrolledEnrollIds.push(r.enrollid);
      }
      deviceInfo = {
        sn: list?.sn || sn,
        count: list?.count ?? 0,
        result: list?.result ?? false,
        available: true,
      };
    } catch (err: any) {
      deviceInfo = { sn, count: 0, result: false, available: false, error: err.message };
    }

    const workerRows = workers.map((w) => ({
      id: w.id,
      name: w.name,
      enrollId: w.enrollId,
      designation: w.designation?.title || null,
      enrolled: w.enrollId ? enrolledEnrollIds.includes(Number(w.enrollId)) : false,
    }));

    return NextResponse.json({
      enrolledEnrollIds,
      device: deviceInfo,
      workers: workerRows,
    });
  } catch (error) {
    console.error('Failed to fetch biometric users:', error);
    return NextResponse.json({ error: 'Failed to fetch biometric users' }, { status: 500 });
  }
}