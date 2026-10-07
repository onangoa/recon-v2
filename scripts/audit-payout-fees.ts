/**
 * DB audit: successful paybill/till (B2B) payouts vs PAYOUT_FEE rows.
 * Read-only — verifies which settled payouts never got the KES 40 fee.
 */
import { prisma } from '../lib/prisma';

async function main() {
  const settled = ['SUCCESS', 'COMPLETED', 'completed', 'success'];

  const payouts = await prisma.transaction.findMany({
    where: {
      transactionType: { in: ['B2B', 'B2C', 'B2POCHI', 'BANK_PESALINK', 'BANK_IFT', 'BANK_MPESA', 'debit'] },
      status: { in: settled },
    },
    select: {
      id: true,
      transactionType: true,
      type: true,
      status: true,
      amount: true,
      reference: true,
      accountReference: true,
      description: true,
      remarks: true,
      walletId: true,
      mpesaReceiptNumber: true,
      callbackReceivedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Settled payouts found: ${payouts.length}\n`);

  let missing = 0;
  for (const tx of payouts) {
    const fee = await prisma.transaction.findFirst({
      where: { reference: `FEE-${tx.id}`, transactionType: 'PAYOUT_FEE' },
      select: { amount: true, status: true },
    });
    const flag = fee ? 'fee-ok' : 'NO-FEE';
    if (!fee) missing++;
    console.log(
      `${flag.padEnd(7)} ${(tx.transactionType || '').padEnd(13)} ${tx.status.padEnd(9)} ` +
      `amt ${String(tx.amount).padStart(7)} ref=${(tx.reference || '').slice(0, 24).padEnd(24)} ` +
      `desc=${(tx.description || '').slice(0, 32).padEnd(32)} fee=${fee ? fee.amount + ' ' + fee.status : '-'} ` +
      `cb=${tx.callbackReceivedAt ? tx.callbackReceivedAt.toISOString() : 'none'} created=${tx.createdAt.toISOString()}`
    );
  }

  console.log(`\nTotal settled payouts: ${payouts.length}, missing fee: ${missing}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
