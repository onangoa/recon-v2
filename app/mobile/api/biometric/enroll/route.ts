import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import {
  mobileRequireContractorPermission,
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';
import { sendUserToDevice, getEnrolledEnrollIds, getDevicePersons } from '@/lib/biometric-service';
import { nextFreeEnrollId } from '@/lib/enroll-id';

/**
 * POST /mobile/api/biometric/enroll
 *
 * Enroll (push) a worker to the biometric device via /api/sendUserToDevice.
 * Mobile mirror of /web/api/biometric/enroll.
 *
 * Body:
 *   { workerId: string, deviceSn?: string }   // enroll the worker stored in the DB
 *   -- or --
 *   { enrollId, name, face?, deviceSn }        // ad-hoc payload (enrollId still required)
 */

/** Loose name match for recognising a worker's own person row on a device. */
function isSamePersonName(a: string, b: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return false;
  return x === y || x.startsWith(y) || y.startsWith(x);
}

export async function POST(request: NextRequest) {
  const permCheck = await mobileRequireContractorPermission(request, 'workers:update');
  if (!permCheck.authorized) return permCheck.error!;
  const contractorId = permCheck.contractorId!;

  try {
    const body = await request.json();

    let enrollId: number | string | undefined = body.enrollId;
    let name: string | undefined = body.name;
    let face: string | undefined = body.face;
    let workerId: string | undefined = body.workerId;
    let deviceSn: string | undefined = body.deviceSn;

    // Resolve the target device from the contractor's configured devices.
    let device = deviceSn
      ? await prisma.biometricDevice.findUnique({
          where: { contractorId_sn: { contractorId, sn: deviceSn } },
        })
      : null;

    if (!device) {
      device = await prisma.biometricDevice.findFirst({
        where: { contractorId, isActive: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!device) {
      return mobileError('No biometric device configured. Add one first.', 400);
    }
    if (!device.isActive) {
      return mobileError(`Device "${device.name}" is inactive. Enable it first.`, 400);
    }

    if (workerId) {
      const worker = await prisma.worker.findFirst({
        where: { id: workerId, contractorId },
        select: { id: true, name: true, enrollId: true },
      });
      if (!worker) {
        return mobileError('Worker not found', 404);
      }
      name = worker.name;
      workerId = worker.id;

      // Server-side Enroll ID assignment (unique per device).
      let personList: { id: number; name: string }[] = [];
      try {
        personList = await getDevicePersons(device.sn);
      } catch {
        personList = [];
      }
      let hardwareIds: number[] = [];
      try {
        hardwareIds = await getEnrolledEnrollIds(device.sn);
      } catch {
        hardwareIds = [];
      }
      const taken = new Set<number>([...personList.map((p) => p.id), ...hardwareIds]);

      const current =
        worker.enrollId !== null && worker.enrollId !== '' ? Number(worker.enrollId) : NaN;
      let assigned: number;
      if (Number.isFinite(current) && !taken.has(current)) {
        assigned = current;
      } else if (
        Number.isFinite(current) &&
        personList.some((p) => p.id === current && isSamePersonName(p.name, worker.name))
      ) {
        assigned = current;
      } else {
        assigned = nextFreeEnrollId([...taken]);
      }
      enrollId = assigned;

      if (String(assigned) !== (worker.enrollId ?? '')) {
        await prisma.worker.update({
          where: { id: worker.id },
          data: { enrollId: String(assigned) },
        });
      }
    }

    if (enrollId === undefined || enrollId === null || enrollId === '') {
      return mobileError('Enroll ID is required to enroll a worker to the device', 400);
    }
    if (!name) {
      return mobileError('Worker name is required', 400);
    }

    const response = await sendUserToDevice({
      sn: device.sn,
      enrollid: Number(enrollId),
      name,
      face: face || '',
      admin: 0,
      access_times: 0,
      card: 0,
      groupid: 0,
      pwd: 0,
      shiftid: 0,
      verifymode: 0,
      zoneid: 0,
      password: '',
      birthday: '',
      department: '',
      starttime: '',
      endtime: '',
      userprofile: '',
    });

    await ActivityLogger.log({
      userId: permCheck.userId || 'system',
      contractorId,
      action: 'CREATE',
      module: 'WORKERS',
      description: `Enrolled worker "${name}" (enrollId ${enrollId}) to device "${device.name}" (${device.sn})`,
      targetId: workerId,
      details: { enrollId, deviceSn: device.sn, result: response.result, command: 'ENROLL_TO_DEVICE' },
    });

    return mobileSuccess({ ok: true, deviceSn: device.sn, deviceResponse: response, enrollId }, 'Worker enrolled to device');
  } catch (error: any) {
    console.error('Mobile failed to enroll worker to device:', error);
    return mobileError(error?.message || 'Failed to enroll worker to device', 502);
  }
}
