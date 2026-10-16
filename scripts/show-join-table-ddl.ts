import { prisma } from '../lib/prisma';

async function main() {
  const join = await prisma.$queryRawUnsafe('SHOW CREATE TABLE _SiteToTeamMember') as any[];
  const row = join[0] as any;
  console.log('keys:', Object.keys(row));
  console.log(JSON.stringify(row, null, 2));
}

main()
  .catch((e) => { console.error('ERROR:', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
