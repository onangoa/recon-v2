import { prisma } from '../lib/prisma';

/**
 * One-off backfill: links existing Worker rows that pre-date the `siteId`
 * column to a site owned by the same contractor. Workers are now enrolled
 * per site (the create form uses the active site; the edit form has a site
 * selector), so every legacy worker must be assigned to a site.
 *
 * Assignment rule per worker (attendance-based):
 *   1. the site of the biometric device they clocked in/out with most
 *      often (AttendanceLog.deviceName -> BiometricDevice.sn -> siteId),
 *      else
 *   2. the contractor's primary site (isPrimary = true), else
 *   3. the contractor's first site (oldest createdAt), else
 *   4. skipped (contractor has no sites) — left unassigned and reported.
 *
 * Non-destructive: only updates rows where siteId IS NULL.
 *
 * Usage:
 *   npm run workers:assign-sites            # apply
 *   npm run workers:assign-sites -- --dry-run   # report only, no writes
 */
async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const unassigned = await prisma.worker.findMany({
    where: { siteId: null },
    select: { id: true, name: true, contractorId: true },
    orderBy: { createdAt: 'asc' },
  });

  process.stdout.write(
    `Found ${unassigned.length} worker(s) without a site.\n` +
      (dryRun ? 'DRY RUN — no changes will be written.\n\n' : '\n'),
  );

  if (unassigned.length === 0) return;

  // Group workers per contractor so devices/sites/attendance are fetched once.
  const byContractor = new Map<string, { id: string; name: string }[]>();
  for (const w of unassigned) {
    const list = byContractor.get(w.contractorId) || [];
    list.push({ id: w.id, name: w.name });
    byContractor.set(w.contractorId, list);
  }

  let fromAttendance = 0;
  let fromFallback = 0;
  let skipped = 0;

  for (const [contractorId, workers] of byContractor) {
    const [devices, fallbackSite, logs] = await Promise.all([
      // sn -> siteId for devices already linked to a site.
      prisma.biometricDevice.findMany({
        where: { contractorId, siteId: { not: null } },
        select: { sn: true, siteId: true },
      }),
      prisma.site.findFirst({
        where: { contractorId },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        select: { id: true, name: true },
      }),
      // Raw scan logs of these workers (deviceName = device serial).
      prisma.attendanceLog.findMany({
        where: {
          attendance: { contractorId, workerId: { in: workers.map((w) => w.id) } },
          deviceName: { not: null },
        },
        select: {
          deviceName: true,
          attendance: { select: { workerId: true } },
        },
      }),
    ]);

    const deviceSite = new Map(devices.map((d) => [d.sn, d.siteId as string]));

    // Tally per worker: siteId -> number of scans recorded there.
    const tally = new Map<string, Map<string, number>>();
    for (const log of logs) {
      const siteId = deviceSite.get(log.deviceName as string);
      if (!siteId) continue; // unknown device or device without a site
      const workerId = log.attendance.workerId;
      const counts = tally.get(workerId) || new Map<string, number>();
      counts.set(siteId, (counts.get(siteId) || 0) + 1);
      tally.set(workerId, counts);
    }

    for (const worker of workers) {
      const counts = tally.get(worker.id);
      let siteId: string | null = null;
      let source: 'attendance' | 'fallback' | null = null;

      if (counts && counts.size > 0) {
        // Most frequently used site wins.
        siteId = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
        source = 'attendance';
      } else if (fallbackSite) {
        siteId = fallbackSite.id;
        source = 'fallback';
      }

      if (!siteId) {
        process.stdout.write(`  Skipped "${worker.name}" — contractor has no sites\n`);
        skipped++;
        continue;
      }

      const label =
        source === 'attendance' ? 'from attendance device usage' : 'fallback (primary/first site)';
      process.stdout.write(`  ${dryRun ? 'Would assign' : 'Assigning'} "${worker.name}" -> site ${siteId} (${label})\n`);

      if (!dryRun) {
        await prisma.worker.update({
          where: { id: worker.id },
          data: { siteId },
        });
      }

      if (source === 'attendance') fromAttendance++;
      else fromFallback++;
    }
  }

  process.stdout.write(
    `\nDone. ${dryRun ? 'Would assign' : 'Assigned'} ${fromAttendance + fromFallback} worker(s) ` +
      `(${fromAttendance} from attendance, ${fromFallback} fallback), skipped ${skipped}.\n`,
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
