/**
 * Inspect a FEE- row: its own txn ref, its parent payout link, and where the
 * parent's ref comes from.
 */
import { prisma } from '../lib/prisma';
import { formatTxnRef } from '../lib/txn-ref';

async function main() {
  const fee = await prisma.transaction.findFirst({
    where: { reference: { startsWith: 'FEE-' } },
    orderBy: { createdAt: 'desc' },
  });
  if (!fee) {
    console.log('No FEE rows found.');
    return;
  }
  console.log('fee row:', {
    id: fee.id,
    seq: fee.seq,
    txnRef: formatTxnRef(fee.seq),
    reference: fee.reference,
    transactionType: fee.transactionType,
    status: fee.status,
    amount: fee.amount,
    createdAt: fee.createdAt.toISOString(),
  });

  const parentId = fee.reference?.slice(4);
  const parent = parentId ? await prisma.transaction.findUnique({ where: { id: parentId } }) : null;
  if (parent) {
    console.log('parent payout:', {
      id: parent.id,
      seq: parent.seq,
      txnRef: formatTxnRef(parent.seq),
      description: parent.description,
      status: parent.status,
    });
  } else {
    console.log('parent payout not found (likely a throwaway test row was cleaned up)');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
