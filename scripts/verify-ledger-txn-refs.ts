/**
 * Verifies the ledger still reconciles and now carries seq/TXN refs through
 * buildWalletLedger (contractor + superadmin + mobile all share it).
 */
import { prisma } from '../lib/prisma';
import { buildWalletLedger } from '../lib/transaction-ledger';
import { formatTxnRef } from '../lib/txn-ref';

async function main() {
  const wallets = await prisma.wallet.findMany({ take: 3 });
  for (const w of wallets) {
    const txs = await prisma.transaction.findMany({ where: { walletId: w.id }, orderBy: { createdAt: 'asc' } });
    const { rows, summary } = buildWalletLedger(txs, w.balance);
    const last = rows[rows.length - 1];
    console.log(
      `wallet "${w.name}": rows=${rows.length} balanced=${summary.balanced} variance=${summary.variance.toFixed(2)}`
    );
    if (last) {
      console.log(`  last: ${formatTxnRef(last.seq)} ${last.direction} KES ${last.amount} -> balanceAfter ${last.balanceAfter}`);
    }
    for (const r of rows) {
      if (typeof r.seq !== 'number' || r.seq <= 0) throw new Error(`row without seq: ${r.id}`);
    }
  }
  console.log('\nLEDGER TXN REF VERIFICATION PASSED');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
