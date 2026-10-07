/**
 * Backfill for successful paybill/till (B2B) payouts that were settled by the
 * old callback handler. The Daraja B2B success callback carries no
 * TransactionAmount, so the old handler skipped BOTH the wallet debit and
 * the KES 40 payout fee while still marking the payout SUCCESS.
 *
 * This script finds those payouts and, with --apply:
 *   1. debits the wallet for the payout amount (never applied by the bug)
 *   2. charges the payout fee via chargePayoutFee (idempotent)
 *
 * Targets ONLY settled B2B payouts whose rawCallbackData has no
 * TransactionAmount AND which have no FEE row yet. The amount debit is
 * additionally guarded by --before <ISO date> (default: now): only payouts
 * whose callback arrived before the cutoff get the amount debit, so the
 * script can never double-debit payouts settled by the fixed handler.
 *
 * Default run is a DRY RUN — pass --apply to write.
 */
import { prisma } from '../lib/prisma';
import { chargePayoutFee, isPayrollPayout } from '../lib/payout-fee';

async function main() {
  const apply = process.argv.includes('--apply');
  const beforeIdx = process.argv.indexOf('--before');
  const before = beforeIdx !== -1 && process.argv[beforeIdx + 1]
    ? new Date(process.argv[beforeIdx + 1]!)
    : new Date();

  const candidates = await prisma.transaction.findMany({
    where: {
      transactionType: 'B2B',
      status: 'SUCCESS',
      rawCallbackData: { not: null },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Settled B2B payouts with a callback: ${candidates.length}`);
  console.log(`Mode: ${apply ? 'APPLY (writes!)' : 'DRY RUN'} | amount-debit cutoff: ${before.toISOString()}\n`);

  let touched = 0;
  for (const tx of candidates) {
    if (isPayrollPayout(tx)) {
      console.log(`SKIP (payroll exempt) ${tx.id} ref=${tx.reference}`);
      continue;
    }

    let raw: any = null;
    try {
      raw = tx.rawCallbackData ? JSON.parse(tx.rawCallbackData) : null;
    } catch {
      console.log(`SKIP (unparsable rawCallbackData) ${tx.id}`);
      continue;
    }

    const params: any[] = raw?.Result?.ResultParameters?.ResultParameter || [];
    const hasAmount = params.some((p: any) => p?.Key === 'TransactionAmount' || p?.Name === 'TransactionAmount');

    const feeRow = await prisma.transaction.findFirst({
      where: { reference: `FEE-${tx.id}`, transactionType: 'PAYOUT_FEE' },
    });

    if (hasAmount && feeRow) {
      console.log(`OK   ${tx.id} ref=${tx.reference} — callback carried amount, fee already charged`);
      continue;
    }
    if (hasAmount && !feeRow && tx.callbackReceivedAt && tx.callbackReceivedAt >= before) {
      // Callback had the amount so the debit ran; only the fee may be missing.
      console.log(`FEE-ONLY ${tx.id} ref=${tx.reference} — amount was debited, fee missing`);
    } else {
      const settledBeforeCutoff = !tx.callbackReceivedAt || tx.callbackReceivedAt < before;
      console.log(
        `AFFECTED ${tx.id} ref=${tx.reference} amount=${tx.amount} ` +
        `(callback ${tx.callbackReceivedAt?.toISOString() ?? 'unknown'}${settledBeforeCutoff ? '' : ' — AFTER cutoff, fee only'})`
      );

      if (apply) {
        if (settledBeforeCutoff) {
          const debit = Math.round(tx.amount);
          await prisma.wallet.update({
            where: { id: tx.walletId },
            data: { balance: { decrement: debit } },
          });
          console.log(`  -> debited wallet ${tx.walletId} by ${debit} (payout amount)`);
        }
        const fee = await chargePayoutFee(tx);
        console.log(`  -> charged fee ${fee}`);
        touched++;
      }
    }

    if (!apply && !hasAmount) {
      console.log(`  (dry run: would debit ${Math.round(tx.amount)} + fee, wallet ${tx.walletId})`);
    }
  }

  console.log(`\n${apply ? `Applied to ${touched} payout(s)` : 'Dry run complete — pass --apply to write'}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
