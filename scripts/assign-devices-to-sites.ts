import { prisma } from '../lib/prisma';

/**
 * One-off backfill: links existing BiometricDevice rows that pre-date the
 * `siteId` column to a site owned by the same contractor. Devices are now
 * scoped per site (Settings → Devices filters by the active site), so every
 * legacy device must be assigned to a site to remain visible.
 *
 * Assignment rule per contractor:
 *   1. the contractor's primary site (isPrimary = true), else
 *   2. the contractor's first site (oldest createdAt), else
 *   3. skipped (contractor has no sites) — left unassigned and reported.
 *
 * Non-destructive: only updates rows where siteId IS NULL.
 */
async function main() {
  const contractors = await prisma.contractor.findMany({
    select: {
      id: true,
      sites: {
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        select: { id: true, name: true, isPrimary: true },
      },
      _count: {
        select: {
          biometricDevices: { where: { siteId: null } },
        },
      },
    },
  });

  const legacyDevices = await prisma.biometricDevice.findMany({
    where: { siteId: null },
    select: { id: true, name: true, sn: true, contractorId: true },
  });

  process.stdout.write(`Found ${legacyDevices.length} device(s) without a site across ${contractors.length} contractor(s)\n`);

  let assigned = 0;
  let skipped = 0;
  const contractorSite = new Map<string, string | null>();

  for (const c of contractors) {
    const site = c.sites.find((s) => s.isPrimary) || c.sites[0] || null;
    contractorSite.set(c.id, site ? site.id : null);
  }

  for (const device of legacyDevices) {
    const siteId = contractorSite.get(device.contractorId) ?? null;
    if (!siteId) {
      process.stdout.write(`  Skipped "${device.name}" (sn: ${device.sn}) — contractor has no sites\n`);
      skipped++;
      continue;
    }
    await prisma.biometricDevice.update({
      where: { id: device.id },
      data: { siteId },
    });
    process.stdout.write(`  Assigned "${device.name}" (sn: ${device.sn}) -> site ${siteId}\n`);
    assigned++;
  }

  process.stdout.write(`\nDone. Assigned ${assigned} device(s), skipped ${skipped}.\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });