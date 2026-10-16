import { prisma } from '../lib/prisma';

async function main() {
  const tables = await prisma.$queryRawUnsafe(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()"
  ) as any[];
  const names = tables.map((t) => Object.values(t)[0]) as string[];
  console.log('join-ish tables:', names.filter((n) => n.toLowerCase().includes('teammember') || n.toLowerCase().includes('site')));
  console.log('total tables:', names.length);

  const tmCols = await prisma.$queryRawUnsafe(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'TeamMember'"
  ) as any[];
  console.log('\nTeamMember columns:', tmCols.map((c) => Object.values(c)[0]).join(', '));

  const siteCols = await prisma.$queryRawUnsafe(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Site'"
  ) as any[];
  console.log('\nSite columns:', siteCols.map((c) => Object.values(c)[0]).join(', '));
}

main()
  .catch((e) => { console.error('ERROR:', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
