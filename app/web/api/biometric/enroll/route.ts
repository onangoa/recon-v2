import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { requireContractorPermission } from '@/lib/require-permission';
import { sendUserToDevice } from '@/lib/biometric-service';

/**
 * POST /web/api/biometric/enroll
 *
 * Enroll (push) a worker to the biometric device via /api/sendUserToDevice.
 *
 * Body:
 *   { workerId: string }          // enroll the worker stored in the DB
 *   -- or --
 *   { enrollId: number|string, name: string, face?: string }  // ad-hoc payload
 *
 * The worker's enrollId (unique in the device) and name are sent. A base64
 * JPEG face photo can be supplied via `face`; otherwise it is omitted.
 */
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

    if (workerId) {
      const worker = await prisma.worker.findFirst({
        where: { id: workerId, contractorId },
        select: { id: true, name: true, enrollId: true },
      });
      if (!worker) {
        return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
      }
      enrollId = worker.enrollId ?? body.enrollId;
      name = worker.name;
      workerId = worker.id;
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
      description: `Enrolled worker "${name}" (enrollId ${enrollId}) to biometric device`,
      targetId: workerId,
      details: { enrollId, result: response.result, command: 'ENROLL_TO_DEVICE' },
    });

    return NextResponse.json({ ok: true, deviceResponse: response, enrollId });
  } catch (error: any) {
    console.error('Failed to enroll worker to device:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to enroll worker to device' },
      { status: 502 }
    );
  }
}