import { prisma } from '../lib/prisma';
import { getSiteAttendanceEntries } from '../lib/biometric-attendance';
import { getRangeReports } from '../lib/daily-report-data';

async function main() {
  const sites = await prisma.site.findMany({
    where: { id: { in: ['cmsyf7zyw000grl7ol9a6h1jn', 'cms75zpbt000l13qnwdd8bojh'] } },
    select: { id: true, name: true, contractorId: true },
  });

  for (const site of sites) {
    console.log(`\n===== ${site.name} (${site.id}) =====`);
    const from = new Date('2026-10-12T00:00:00');
    const to = new Date('2026-10-12T00:00:00');
    const entries = await getSiteAttendanceEntries(site.contractorId, site.id, from, to);
    console.log('attendance entries for Oct 12:', entries.length);
    console.log(entries);

    const reports = await getRangeReports(site.id, from, to);
    for (const r of reports) {
      console.log(`report ${r.id} (${r.status}) dayWorkforce:`, r.dayWorkforce);
      const total = (r.dayWorkforce || []).reduce((s, w) => s + w.count, 0);
      console.log('TOTAL PRESENT:', total);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
