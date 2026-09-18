import { prisma } from '../lib/prisma';

async function main() {
  let migrations: any[] = [];
  try {
    migrations = await prisma.$queryRawUnsafe(
      'SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY migration_name'
    );
  } catch {
    console.log('_prisma_migrations table: MISSING (no migration history)');
  }
  if (migrations.length) {
    console.log('migration history:', migrations.map((m) => m.migration_name).join(', '));
  }

  const tables = (await prisma.$queryRawUnsafe(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()"
  )) as any[];
  const names = tables.map((t) => Object.values(t)[0]);
  console.log('WorkerShift table:', names.includes('WorkerShift') ? 'EXISTS' : 'MISSING');
  console.log('PayoutBeneficiary table:', names.includes('PayoutBeneficiary') ? 'EXISTS' : 'MISSING');

  const cols = (await prisma.$queryRawUnsafe(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'PayoutBeneficiary'"
  )) as any[];
  console.log('PayoutBeneficiary columns:', cols.map((c) => Object.values(c)[0]).join(', '));

  const shiftCount = names.includes('Shift')
    ? (await prisma.$queryRawUnsafe('SELECT COUNT(*) as c FROM Shift')) as any[]
    : [];
  if (shiftCount.length) console.log('Shift rows:', shiftCount[0].c);

  const workerCols = (await prisma.$queryRawUnsafe(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'Worker' AND column_name IN ('shiftId', 'preferredShiftId')"
  )) as any[];
  console.log('Worker shift columns:', workerCols.map((c) => Object.values(c)[0]).join(', ') || 'none');
}

main()
  .catch((e) => { console.error('ERROR:', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
