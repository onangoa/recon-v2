/**
 * Verifies the Transaction.seq column: existing rows were backfilled by the
 * AUTO_INCREMENT ALTER and new prisma.transaction.create calls get a seq
 * assigned by MySQL. Throwaway rows are cleaned up.
 */
import { prisma } from '../lib/prisma';

async function main() {
  const total = await prisma.transaction.count();
  console.log(`Existing transactions: ${total} (seq is NOT NULL — every row must have one)`);

  const sample = await prisma.transaction.findMany({ take: 3, orderBy: { seq: 'asc' }, select: { seq: true, id: true, createdAt: true } });
  console.log('First seqs:', sample.map((s) => `${s.seq} (${s.id.slice(0, 8)}, ${s.createdAt.toISOString().slice(0, 10)})`).join(' | '));

  const contractor = await prisma.contractor.findFirst();
  if (!contractor) throw new Error('No contractor found');
  const wallet = await prisma.wallet.create({ data: { name: 'SEQ TEST', contractorId: contractor.id, balance: 0 } });
  try {
    const tx = await prisma.transaction.create({
      data: { walletId: wallet.id, type: 'debit', amount: 1, description: 'seq test' },
    });
    console.log(`New create assigned seq: ${tx.seq}`);
    if (tx.seq == null) throw new Error('seq was NOT auto-assigned on create');
  } finally {
    await prisma.transaction.deleteMany({ where: { walletId: wallet.id } });
    await prisma.wallet.deleteMany({ where: { id: wallet.id } });
    console.log('Throwaway rows removed.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
