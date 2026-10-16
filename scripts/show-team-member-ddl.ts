import { prisma } from '../lib/prisma';

async function main() {
  const tm = await prisma.$queryRawUnsafe('SHOW CREATE TABLE TeamMember') as any[];
  console.log('=== TeamMember BEFORE push ===');
  console.log(tm[0]['Create Table']);

  const cols = await prisma.$queryRawUnsafe(
    "SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'TeamMember'"
  ) as any[];
  console.log('\nconstraint names:', cols.map((c: any) => c.CONSTRAINT_NAME).join(', '));
}

main()
  .catch((e) => { console.error('ERROR:', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
