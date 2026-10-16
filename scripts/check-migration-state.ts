import { prisma } from '../lib/prisma';

async function main() {
  let rows: any[] = [];
  try {
    rows = await prisma.$queryRawUnsafe(
      'SELECT migration_name, finished_at, applied_steps_count, rolled_back_at FROM _prisma_migrations ORDER BY migration_name'
    );
  } catch (e: any) {
    console.log('_prisma_migrations missing:', e.message);
    return;
  }
  rows.forEach((r) =>
    console.log(
      r.rolled_back_at ? 'ROLLED-BACK' : r.finished_at ? 'APPLIED    ' : 'PENDING    ',
      r.migration_name
    )
  );

  const drift = await prisma.$queryRawUnsafe('SELECT COUNT(*) AS c FROM TeamMember WHERE siteId IS NOT NULL');
  console.log('\nTeamMembers with a legacy siteId set:', (drift as any[])[0].c);
}

main()
  .catch((e) => { console.error('ERROR:', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
