import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { requireContractorPermission } from '@/lib/require-permission';
import { sendUserToDevice, getEnrolledEnrollIds, getDevicePersons } from '@/lib/biometric-service';
import { nextFreeEnrollId } from '@/lib/enroll-id';

/**
 * POST /web/api/biometric/enroll
 *
 * Enroll (push) a worker to the biometric device via /api/sendUserToDevice.
 *
 * Body:
 *   { workerId: string, deviceSn?: string }   // enroll the worker stored in the DB
 *   -- or --
 *   { enrollId, name, face?, deviceSn }        // ad-hoc payload (enrollId still required)
 *
 * `deviceSn` selects which of the contractor's configured devices to push to.
 * If omitted, the first active configured device is used.
 *
 * The Enroll ID is assigned SERVER-SIDE (unique per device): the first free
 * slot of the device's namespace (person-table registry + ids enrolled on the
 * hardware), e.g. 1,2,3,10 taken -> 4. A worker keeps an existing ID when it
 * is still free on the device or already registered to the same person.
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
  const permCheck = await requireContractorPermission(request, 'workers:update');
  if (!permCheck.authorized) return permCheck.error;
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
      return NextResponse.json(
        { error: 'No biometric device configured. Add one under Settings → Devices.' },
        { status: 400 }
      );
    }
    if (!device.isActive) {
      return NextResponse.json(
        { error: `Device "${device.name}" is inactive. Enable it in Settings → Devices.` },
        { status: 400 }
      );
    }

    if (workerId) {
      const worker = await prisma.worker.findFirst({
        where: { id: workerId, contractorId },
        select: { id: true, name: true, enrollId: true },
      });
      if (!worker) {
        return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
      }
      name = worker.name;
      workerId = worker.id;

      // Server-side Enroll ID assignment (unique per device).
      // Taken = the device's person registry (with names) + ids enrolled on
      // the hardware. Best-effort: on API failure fall back to what we have.
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
        // Worker already has an ID that is free on this device — keep it.
        assigned = current;
      } else if (
        Number.isFinite(current) &&
        personList.some((p) => p.id === current && isSamePersonName(p.name, worker.name))
      ) {
        // The device slot already belongs to this worker (re-enroll / update).
        assigned = current;
      } else {
        // Assign the first free slot of this device (e.g. 1,2,3,10 taken -> 4).
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
      return NextResponse.json(
        { error: 'Enroll ID is required to enroll a worker to the device' },
        { status: 400 }
      );
    }
    if (!name) {
      return NextResponse.json({ error: 'Worker name is required' }, { status: 400 });
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

    return NextResponse.json({ ok: true, deviceSn: device.sn, deviceResponse: response, enrollId });
  } catch (error: any) {
    console.error('Failed to enroll worker to device:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to enroll worker to device' },
      { status: 502 }
    );
  }
}