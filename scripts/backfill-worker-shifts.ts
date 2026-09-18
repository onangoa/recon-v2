import { prisma } from '../lib/prisma';

/**
 * One-off backfill: mirrors every worker's existing shift assignment into
 * the WorkerShift join table introduced with multi-shift support, so no
 * legacy assignment is lost. Worker.shiftId stays as the "primary" shift;
 * the join table is what the multi-shift UI and day-based shift resolution
 * read.
 *
 * The 20260918000000_add_worker_shifts migration already backfills on
 * `prisma migrate deploy`; this script covers databases maintained with
 * `prisma db push` (no migrations table) and can be re-run safely any
 * time — it is idempotent.
 *
 * Non-destructive: only inserts missing join rows and repairs a null
 * primary. Nothing is ever deleted or reassigned away from a worker.
 *
 * Usage:
 *   npm run shifts:backfill            # apply
 *   npm run shifts:backfill -- --dry-run   # report only, no writes
 */
async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const workers = await prisma.worker.findMany({
    where: { OR: [{ shiftId: { not: null } }, { workerShifts: { some: {} } }] },
    select: {
      id: true,
      name: true,
      shiftId: true,
      workerShifts: {
        select: { shiftId: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  const noShift = await prisma.worker.count({
    where: { shiftId: null, workerShifts: { none: {} } },
  });

  process.stdout.write(
    `Found ${workers.length} worker(s) with shift assignments (${noShift} with no shift at all).\n` +
      (dryRun ? 'DRY RUN — no changes will be written.\n\n' : '\n'),
  );

  const missing: { workerId: string; shiftId: string }[] = [];
  const repairs: { workerId: string; shiftId: string }[] = [];
  let alreadyMirrored = 0;

  for (const worker of workers) {
    const assignedIds = worker.workerShifts.map((ws) => ws.shiftId);

    if (worker.shiftId) {
      if (assignedIds.includes(worker.shiftId)) {
        alreadyMirrored++;
      } else {
        missing.push({ workerId: worker.id, shiftId: worker.shiftId });
        process.stdout.write(
          `  ${worker.name}: will mirror primary shift ${worker.shiftId} into WorkerShift\n`,
        );
      }
    } else if (assignedIds.length > 0) {
      // Join rows exist but the primary FK was lost (e.g. the shift was
      // deleted then restored, or rows were imported) — restore the
      // oldest assignment as the primary.
      repairs.push({ workerId: worker.id, shiftId: assignedIds[0] });
      process.stdout.write(
        `  ${worker.name}: will restore primary shift ${assignedIds[0]} from its oldest assignment\n`,
      );
    }
  }

  if (dryRun) {
    process.stdout.write(
      `\nDry run done. Would mirror ${missing.length} assignment(s), repair ${repairs.length} primary shift(s); ${alreadyMirrored} already mirrored.\n`,
    );
    return;
  }

  if (missing.length > 0) {
    await prisma.workerShift.createMany({
      data: missing,
      skipDuplicates: true,
    });
  }

  for (const repair of repairs) {
    await prisma.worker.update({
      where: { id: repair.workerId },
      data: { shiftId: repair.shiftId },
    });
  }

  process.stdout.write(
    `\nDone. Mirrored ${missing.length} assignment(s) into WorkerShift, repaired ${repairs.length} primary shift(s); ${alreadyMirrored} were already mirrored. No assignments were removed.\n`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
