/**
 * Verify Worker.nationalId uniqueness semantics (per contractor):
 *  1. same nationalId under two different contractors -> allowed
 *  2. duplicate nationalId within one contractor      -> rejected (P2002)
 *  3. delete + re-add same nationalId                -> allowed
 * Cleans up all rows it creates.
 */
import { prisma } from '../lib/prisma';

async function main() {
  const contractors = await prisma.contractor.findMany({ take: 2, select: { id: true, companyName: true } });
  if (contractors.length < 2) throw new Error('Need 2 contractors for this test');
  const [a, b] = contractors;
  console.log(`A: ${a.companyName} | B: ${b.companyName}`);
  const NID = 'REPRO-NID-002';
  const created: string[] = [];
  const tryCreate = async (contractorId: string, name: string) => {
    try {
      const w = await prisma.worker.create({ data: { contractorId, name, nationalId: NID } });
      created.push(w.id);
      console.log(`  OK: ${name}`);
      return true;
    } catch (e: any) {
      console.log(`  BLOCKED (${e.code} on ${e.meta?.target})`);
      return false;
    }
  };

  console.log('1. same nationalId under two contractors:');
  await tryCreate(a.id, 'Worker under A');
  const cross = await tryCreate(b.id, 'Worker under B');
  console.log(cross ? '   -> cross-contractor sharing ALLOWED (was the prod blocker)' : '   -> STILL BLOCKED');

  console.log('2. duplicate within contractor A (must be rejected):');
  const dup = await tryCreate(a.id, 'Duplicate under A');
  console.log(dup ? '   -> ERROR: duplicate was allowed!' : '   -> rejected as expected');

  console.log('3. delete + re-add within contractor A:');
  await prisma.worker.deleteMany({ where: { contractorId: a.id, nationalId: NID } });
  const readd = await tryCreate(a.id, 'Re-added under A');
  console.log(readd ? '   -> re-add OK' : '   -> ERROR: re-add blocked');

  await prisma.worker.deleteMany({ where: { nationalId: NID } });
  console.log(`cleanup done (${created.length} rows created, all removed)`);
}

main()
  .catch((e) => { console.error('ERROR:', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
