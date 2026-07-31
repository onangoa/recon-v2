import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireContractorPermission } from '@/lib/require-permission';
import { getUserList } from '@/lib/biometric-service';

/**
 * GET /web/api/biometric/users?deviceSn=AYTI...
 *
 * Returns the list of users enrolled on the selected biometric device (from
 * /api/getUserList) alongside the contractor's workers, marking which
 * workers are currently enrolled to that device.
 *
 * The device serial number must be one of the contractor's configured
 * devices (Settings → Devices). If omitted, the first active device is used.
 *
 * Response:
 *   {
 *     enrolledEnrollIds: number[],
 *     device: { sn, count, available, ... },
 *     workers: [{ id, name, enrollId, enrolled: boolean }]
 *   }
 */
export async function GET(request: NextRequest) {
  const permCheck = await requireContractorPermission(request, 'workers:read');
  if (!permCheck.authorized) return permCheck.error;
  const contractorId = permCheck.contractorId!;

  try {
    const workers = await prisma.worker.findMany({
      where: { contractorId },
      select: { id: true, name: true, enrollId: true, designation: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // Resolve the device SN: explicit query param, else first active device.
    const { searchParams } = new URL(request.url);
    let sn = searchParams.get('deviceSn');

    if (!sn) {
      const first = await prisma.biometricDevice.findFirst({
        where: { contractorId, isActive: true },
        orderBy: { createdAt: 'desc' },
      });
      sn = first?.sn || null;
    } else {
      // Validate the supplied SN belongs to this contractor.
      const owns = await prisma.biometricDevice.findUnique({
        where: { contractorId_sn: { contractorId, sn } },
      });
      if (!owns) {
        return NextResponse.json({ error: 'Unknown device for this account' }, { status: 404 });
      }
    }

    const enrolledEnrollIds: number[] = [];
    let deviceInfo: any = null;
    let deviceChecked = false;

    if (!sn) {
      deviceInfo = { sn: null, count: 0, result: false, available: false, error: 'No biometric device configured. Add one under Settings → Devices.' };
    } else {
      try {
        const list = await getUserList(sn);
        if (list?.record) {
          for (const r of list.record) enrolledEnrollIds.push(r.enrollid);
        }
        deviceInfo = {
          sn: list?.sn || sn,
          count: list?.count ?? 0,
          result: list?.result ?? false,
          available: true,
        };
        deviceChecked = true;
      } catch (err: any) {
        deviceInfo = { sn, count: 0, result: false, available: false, error: err.message };
      }
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
      deviceChecked,
      device: deviceInfo,
      workers: workerRows,
    });
  } catch (error) {
    console.error('Failed to fetch biometric users:', error);
    return NextResponse.json({ error: 'Failed to fetch biometric users' }, { status: 500 });
  }
}