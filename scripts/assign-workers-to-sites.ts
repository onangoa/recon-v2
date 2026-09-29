import { prisma } from '../lib/prisma';

/**
 * One-off backfill: links existing Worker rows that pre-date the `siteId`
 * column to a site owned by the same contractor. Workers are now enrolled
 * per site (the create form uses the active site; the edit form has a site
 * selector), so every legacy worker must be assigned to a site.
 *
 * CLI flags:
 *   --site <siteId>      Force mode: every still-unassigned worker of that
 *                        site's contractor is assigned to the given site
 *                        directly (no attendance inference).
 *   --contractor <id>    Scope the run to one contractor. In force mode it
 *                        must match the site's owner.
 *   --dry-run            Report only, no writes.
 *
 * Default mode (no --site) assigns per worker (attendance-based):
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
 *   npm run workers:assign-sites                        # all contractors, attendance + fallback
 *   npm run workers:assign-sites -- --contractor <id>   # one contractor only
 *   npm run workers:assign-sites -- --site <id>         # force that site's contractor onto the site
 *   npm run workers:assign-sites -- --site <id> --dry-run
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  // Accepts `--flag value` and `--flag=value`.
  const readFlag = (name: string): string | null => {
    const idx = args.indexOf(name);
    if (idx !== -1) {
      const next = args[idx + 1];
      if (next && !next.startsWith('--')) return next;
    }
    const hit = args.find((a) => a.startsWith(`${name}=`));
    return hit ? hit.slice(name.length + 1) : null;
  };

  const siteArg = readFlag('--site');
  const contractorArg = readFlag('--contractor');

  // Optional contractor scope (validated up front for a clear error).
  let contractorId: string | null = null;
  if (contractorArg) {
    const contractor = await prisma.contractor.findUnique({
      where: { id: contractorArg },
      select: { id: true, companyName: true },
    });
    if (!contractor) {
      process.stderr.write(`Contractor "${contractorArg}" not found.\n`);
      process.exit(1);
    }
    contractorId = contractor.id;
  }

  // Optional forced site: everything still unassigned goes to this site.
  let forcedSite: { id: string; name: string; contractorId: string } | null = null;
  if (siteArg) {
    const site = await prisma.site.findUnique({
      where: { id: siteArg },
      select: { id: true, name: true, contractorId: true },
    });
    if (!site) {
      process.stderr.write(`Site "${siteArg}" not found.\n`);
      process.exit(1);
    }
    if (contractorId && site.contractorId !== contractorId) {
      process.stderr.write(
        `Site "${site.name}" belongs to contractor ${site.contractorId}, not ${contractorId}.\n`,
      );
      process.exit(1);
    }
    forcedSite = site;
    // A site belongs to exactly one contractor — force mode runs on it.
    contractorId = site.contractorId;
  }

  const where: any = { siteId: null };
  if (contractorId) where.contractorId = contractorId;

  const unassigned = await prisma.worker.findMany({
    where,
    select: { id: true, name: true, contractorId: true },
    orderBy: { createdAt: 'asc' },
  });

  const mode = forcedSite
    ? `forced site "${forcedSite.name}" (${forcedSite.id})`
    : 'attendance-based + primary-site fallback';
  process.stdout.write(
    `Found ${unassigned.length} worker(s) without a site` +
      (contractorId ? ` for contractor ${contractorId}` : '') +
      `.\nMode: ${mode}.\n` +
      (dryRun ? 'DRY RUN — no changes will be written.\n\n' : '\n'),
  );

  if (unassigned.length === 0) return;

  // ---- Force mode: no inference, everything goes to the chosen site ----
  if (forcedSite) {
    let forced = 0;
    for (const worker of unassigned) {
      process.stdout.write(
        `  ${dryRun ? 'Would assign' : 'Assigning'} "${worker.name}" -> site ${forcedSite.id} (forced site)\n`,
      );
      if (!dryRun) {
        await prisma.worker.update({
          where: { id: worker.id },
          data: { siteId: forcedSite.id },
        });
      }
      forced++;
    }
    process.stdout.write(
      `\nDone. ${dryRun ? 'Would assign' : 'Assigned'} ${forced} worker(s) to site ${forcedSite.id}.\n`,
    );
    return;
  }

  // ---- Default mode: group workers per contractor so devices/sites ----
  // ---- and attendance logs are fetched once per contractor.         ----
  const byContractor = new Map<string, { id: string; name: string }[]>();
  for (const w of unassigned) {
    const list = byContractor.get(w.contractorId) || [];
    list.push({ id: w.id, name: w.name });
    byContractor.set(w.contractorId, list);
  }

  let fromAttendance = 0;
  let fromFallback = 0;
  let skipped = 0;

  for (const [cid, workers] of byContractor) {
    const [devices, fallbackSite, logs] = await Promise.all([
      // sn -> siteId for devices already linked to a site.
      prisma.biometricDevice.findMany({
        where: { contractorId: cid, siteId: { not: null } },
        select: { sn: true, siteId: true },
      }),
      prisma.site.findFirst({
        where: { contractorId: cid },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        select: { id: true, name: true },
      }),
      // Raw scan logs of these workers (deviceName = device serial).
      prisma.attendanceLog.findMany({
        where: {
          attendance: { contractorId: cid, workerId: { in: workers.map((w) => w.id) } },
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
