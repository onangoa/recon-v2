import { prisma } from './prisma';
import type { ShiftShape } from './attendance-utils';

type ShiftLike = ShiftShape & { id: string };

interface WorkerWithRelations {
  shiftId?: string | null;
  shift?: ShiftLike | null;
  workerShifts?: { shift: ShiftLike }[];
}

/**
 * All shifts a worker holds: the primary (Worker.shiftId) first, then any
 * additional assignments, deduplicated by id.
 */
export function collectShifts(worker: WorkerWithRelations): ShiftLike[] {
  const out: ShiftLike[] = [];
  const seen = new Set<string>();
  if (worker.shift) {
    out.push(worker.shift);
    seen.add(worker.shift.id);
  }
  for (const ws of worker.workerShifts || []) {
    if (ws.shift && !seen.has(ws.shift.id)) {
      out.push(ws.shift);
      seen.add(ws.shift.id);
    }
  }
  return out;
}

/**
 * Flatten a prisma worker (with `workerShifts` included) into an API
 * response carrying a plain `shifts: Shift[]` array.
 */
export function withShiftsArray<T extends WorkerWithRelations>(worker: T) {
  const { workerShifts, ...rest } = worker;
  return {
    ...rest,
    shifts: (workerShifts || []).map((ws) => ws.shift),
  };
}

/**
 * Parse the shift assignment payload from a worker create/update body.
 * Accepts `shiftIds` (array) or the legacy single `shiftId`. Returns
 * undefined when the body carries neither, so updates can leave the
 * assignments untouched.
 */
export function normalizeShiftIdsInput(body: Record<string, unknown>): string[] | undefined {
  const clean = (value: unknown): value is string =>
    typeof value === 'string' && value !== '' && value !== 'null' && value !== 'undefined';

  if (Array.isArray(body.shiftIds)) {
    return Array.from(new Set(body.shiftIds.filter(clean)));
  }
  if (body.shiftId !== undefined) {
    return clean(body.shiftId) ? [body.shiftId as string] : [];
  }
  return undefined;
}

/**
 * Verify every shift id belongs to the contractor. Returns the validated
 * ids or null when an id is foreign/unknown.
 */
export async function validateShiftOwnership(
  shiftIds: string[],
  contractorId: string,
): Promise<string[] | null> {
  if (shiftIds.length === 0) return [];
  const owned = await prisma.shift.findMany({
    where: { id: { in: shiftIds }, contractorId },
    select: { id: true },
  });
  if (owned.length !== shiftIds.length) return null;
  return shiftIds;
}

/**
 * Persist a worker's shift assignments: the first id becomes the primary
 * shift (Worker.shiftId) and the join rows are synced to the full list.
 */
export async function syncWorkerShiftAssignments(
  workerId: string,
  shiftIds: string[],
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    if (shiftIds.length === 0) {
      await tx.workerShift.deleteMany({ where: { workerId } });
    } else {
      await tx.workerShift.deleteMany({
        where: { workerId, shiftId: { notIn: shiftIds } },
      });
    }
    await tx.workerShift.createMany({
      data: shiftIds.map((shiftId) => ({ workerId, shiftId })),
      skipDuplicates: true,
    });
    await tx.worker.update({
      where: { id: workerId },
      data: { shiftId: shiftIds[0] || null },
    });
  });
}

/** Include clause for worker queries that need the full shift list. */
export const workerShiftInclude = {
  workerShifts: { include: { shift: true } },
} as const;
