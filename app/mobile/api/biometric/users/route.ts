import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mobileRequireContractorPermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';
import { getUserList, getDeviceEnrollIds } from '@/lib/biometric-service';

/**
 * GET /mobile/api/biometric/users?deviceSn=AYTI...
 *
 * Returns the list of users enrolled on the selected biometric device (from
 * /api/getUserList) alongside the contractor's workers, marking which
 * workers are currently enrolled to that device.
 * Mobile mirror of /web/api/biometric/users.
 *
 * Response (mobileSuccess envelope):
 *   {
 *     enrolledEnrollIds: number[],
 *     deviceEnrollIds: number[],
 *     deviceChecked: boolean,
 *     device: { sn, count, result, available, error? },
 *     workers: [{ id, name, enrollId, designation, enrolled }]
 *   }
 */
export async function GET(request: NextRequest) {
  const permCheck = await mobileRequireContractorPermission(request, 'workers:read');
  if (!permCheck.authorized) return permCheck.error!;
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
        return mobileError('Unknown device for this account', 404);
      }
    }

    const enrolledEnrollIds: number[] = [];
    let deviceInfo: any = null;
    let deviceChecked = false;

    if (!sn) {
      deviceInfo = { sn: null, count: 0, result: false, available: false, error: 'No biometric device configured. Add one first.' };
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

    // Per-device taken set: enroll IDs are unique per device, so an ID is
    // taken when it is registered for this device in the fingerprint backend's
    // person table (legacy global rows included) or enrolled on the hardware.
    let personEnrollIds: number[] = [];
    if (sn) {
      try {
        personEnrollIds = await getDeviceEnrollIds(sn);
      } catch {
        personEnrollIds = [];
      }
    }
    const deviceTakenIds = Array.from(new Set([...enrolledEnrollIds, ...personEnrollIds]));

    const workerRows = workers.map((w) => ({
      id: w.id,
      name: w.name,
      enrollId: w.enrollId,
      designation: w.designation?.title || null,
      enrolled: w.enrollId ? enrolledEnrollIds.includes(Number(w.enrollId)) : false,
    }));

    return mobileSuccess({
      enrolledEnrollIds,
      deviceEnrollIds: deviceTakenIds,
      deviceChecked,
      device: deviceInfo,
      workers: workerRows,
    });
  } catch (error) {
    console.error('Mobile failed to fetch biometric users:', error);
    return mobileError('Failed to fetch biometric users', 500);
  }
}
