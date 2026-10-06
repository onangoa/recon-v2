/**
 * Sanity test for the B2B PartyB fix (run against the local dev DB).
 * Part 1 checks the pure resolveB2BDestination mapping for every payout
 * storage shape. Part 2 checks the initiateB2B fail-fast guardrail using a
 * throwaway wallet + pending transaction — an invalid PartyB is rejected
 * before any M-Pesa call, so nothing is sent and no money moves.
 */
import { prisma } from '../lib/prisma';
import { resolveB2BDestination, initiateB2B } from '../lib/mpesa-service';

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
  console.log(`ok - ${label}: ${JSON.stringify(actual)}`);
}

async function main() {
  console.log('--- 1. resolveB2BDestination storage shapes ---');
  assertEqual(
    resolveB2BDestination({ reference: '413627', accountReference: 'ACC00123' }),
    '413627',
    'wallet paybill with account number (paybill from reference)'
  );
  assertEqual(
    resolveB2BDestination({ reference: '413627', accountReference: '413627' }),
    '413627',
    'wallet paybill without account number'
  );
  assertEqual(
    resolveB2BDestination({ reference: '95105551', accountReference: '95105551' }),
    '95105551',
    'wallet till payout'
  );
  assertEqual(
    resolveB2BDestination({ reference: 'PAYROLL-3f2a9c1d-8b41e2af', accountReference: '888880' }),
    '888880',
    'payroll paybill payout (shortcode from accountReference)'
  );
  assertEqual(
    resolveB2BDestination({ reference: 'PAYROLL-3f2a9c1d-9c31e2af', accountReference: '373717' }),
    '373717',
    'payroll till payout (till from accountReference)'
  );
  assertEqual(
    resolveB2BDestination({ reference: null, accountReference: '413627' }),
    '413627',
    'missing reference falls back to accountReference'
  );

  console.log('\n--- 2. initiateB2B guardrail (throwaway rows, no M-Pesa call) ---');
  const contractor = await prisma.contractor.findFirst();
  if (!contractor) {
    console.log('No contractor found — guardrail test skipped.');
    return;
  }
  const wallet = await prisma.wallet.create({
    data: { name: 'TEST B2B PartyB', contractorId: contractor.id, balance: 10000 },
  });
  const tx = await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      type: 'debit',
      amount: 500,
      status: 'pending_approval',
      transactionType: 'B2B',
      remarks: 'paybill',
      reference: '413627',
      accountReference: 'ACC00123',
    },
  });

  try {
    for (const badPartyB of ['ACC00123', '254711000111', '413 627', '']) {
      let thrown: string | null = null;
      try {
        await initiateB2B(badPartyB, 500, wallet.id, 'ACC00123', 'BusinessPayBill', 'guardrail test', tx.id);
      } catch (e: any) {
        thrown = e.message;
      }
      if (!thrown || !/Invalid paybill\/till number/.test(thrown)) {
        throw new Error(`Guardrail did not reject PartyB "${badPartyB}": ${thrown}`);
      }
      console.log(`ok - PartyB "${badPartyB}" rejected: ${thrown}`);
    }

    const txAfter = await prisma.transaction.findUniqueOrThrow({ where: { id: tx.id } });
    assertEqual(txAfter.status, 'pending_approval', 'throwaway tx untouched by guardrail');
    assertEqual(txAfter.conversationId, null, 'no M-Pesa conversation recorded (no call made)');

    console.log('\nALL PARTYB TESTS PASSED');
  } finally {
    await prisma.transaction.deleteMany({ where: { walletId: wallet.id } });
    await prisma.wallet.deleteMany({ where: { id: wallet.id } });
    console.log('\nThrowaway wallet and transaction removed.');
  }
}

main()
  .catch((e) => {
    console.error('TEST FAILED:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
