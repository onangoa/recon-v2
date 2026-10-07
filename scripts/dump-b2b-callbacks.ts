/**
 * Dump the rawCallbackData of the settled B2B payout to see the exact
 * callback shape and whether the fee path should have run.
 */
import { prisma } from '../lib/prisma';

async function main() {
  const b2b = await prisma.transaction.findMany({
    where: { transactionType: 'B2B' },
    orderBy: { createdAt: 'asc' },
  });

  for (const tx of b2b) {
    console.log('='.repeat(80));
    console.log(`id=${tx.id} ref=${tx.reference} status=${tx.status} amount=${tx.amount}`);
    console.log(`remarks=${tx.remarks} accountReference=${tx.accountReference}`);
    console.log(`created=${tx.createdAt.toISOString()} callback=${tx.callbackReceivedAt?.toISOString() ?? 'none'}`);
    console.log('rawCallbackData:', tx.rawCallbackData ?? 'none');
    console.log('rawApiResponse:', tx.rawApiResponse ?? 'none');

    const wallet = await prisma.wallet.findUnique({ where: { id: tx.walletId }, select: { balance: true, name: true } });
    console.log(`wallet ${tx.walletId} (${wallet?.name}) balance=${wallet?.balance}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
