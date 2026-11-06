/**
 * Offline test for the working <-> utility account transfer flow (no M-Pesa
 * call is made). Creates a throwaway wallet + WORKING_TO_UTILITY transaction,
 * feeds a synthetic Daraja B2B SUCCESS callback through handleB2BCallback and
 * checks that the transaction is marked SUCCESS, the wallet balance is
 * untouched and no PAYOUT_FEE row is created (internal transfer, not a
 * payout). Also verifies the UTILITY_TO_WORKING direction and the account
 * balance callback parsing (pipe-delimited AccountBalance parameter).
 */
import { prisma } from '../lib/prisma';
import {
  handleB2BCallback,
  handleAccountBalanceCallback,
  isAccountTransfer,
  parseDarajaAccountBalance,
  TransactionType,
} from '../lib/mpesa-service';

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
  console.log(`ok - ${label}`);
}

async function testTransferCallback(direction: 'working' | 'utility') {
  const type =
    direction === 'working' ? TransactionType.WORKING_TO_UTILITY : TransactionType.UTILITY_TO_WORKING;
  console.log(`\n--- ${type} success callback (wallet + fee must be untouched) ---`);

  const wallet = await prisma.wallet.create({
    data: { name: `TEST transfer ${Date.now()}`, balance: 5000 },
  });
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const tx = await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      type,
      amount: 1000,
      status: 'PENDING',
      transactionType: type,
      conversationId: `AG_T_${unique}`,
      originatorConversationId: `OC_T_${unique}`,
      transactionDesc: 'test',
    },
  });

  assertEqual(isAccountTransfer(tx), true, 'isAccountTransfer detects the transfer row');
  assertEqual(isAccountTransfer({ transactionType: 'B2B' }), false, 'isAccountTransfer rejects B2B');

  try {
    const callback = {
      Result: {
        ResultType: 0,
        ResultCode: 0,
        ResultDesc: 'The service request is processed successfully.',
        OriginatorConversationID: tx.originatorConversationId!,
        ConversationID: tx.conversationId!,
        TransactionID: 'NLJ7TESTTRAN1',
        ResultParameters: {
          ResultParameter: [
            { Key: 'Currency', Value: 'KES' },
            { Key: 'DebitAccountCurrentBalance', Value: '{Amount={CurrencyCode=KES, MinimumAmount=400000, BasicAmount=4000.00}}' },
          ],
        },
        ReferenceData: { ReferenceItem: [{ Key: 'QueueTimeoutURL' }] },
      },
    };

    const result = await handleB2BCallback(callback);
    assertEqual(result.success, true, 'callback processed');

    const txAfter = await prisma.transaction.findUniqueOrThrow({ where: { id: tx.id } });
    const walletAfter = await prisma.wallet.findUniqueOrThrow({ where: { id: wallet.id } });
    const feeRow = await prisma.transaction.findFirst({
      where: { reference: `FEE-${tx.id}`, transactionType: 'PAYOUT_FEE' },
    });

    assertEqual(txAfter.status, 'SUCCESS', 'transfer marked SUCCESS');
    assertEqual(txAfter.mpesaTransactionId, 'NLJ7TESTTRAN1', 'mpesa transaction id stored');
    assertEqual(walletAfter.balance, 5000, 'wallet balance untouched (was 5000)');
    assertEqual(feeRow, null, 'no PAYOUT_FEE charged');
  } finally {
    await prisma.transaction.deleteMany({ where: { walletId: wallet.id } });
    await prisma.wallet.deleteMany({ where: { id: wallet.id } });
    console.log('Throwaway rows removed.');
  }
}

async function testBalanceParsing() {
  console.log('\n--- AccountBalance parsing + balance callback ---');

  const parsed = parseDarajaAccountBalance(
    'Working Account|KES|481000.00|481000.00|1648377559000, Utility Account|KES|91428.50|91428.50|1648377559000'
  );
  assertEqual(parsed.length, 2, 'two accounts parsed');
  assertEqual(parsed[0].name, 'Working Account', 'working account name');
  assertEqual(parsed[0].balance, 481000, 'working account balance');
  assertEqual(parsed[1].name, 'Utility Account', 'utility account name');
  assertEqual(parsed[1].balance, 91428.5, 'utility account balance');

  const wallet = await prisma.wallet.create({
    data: { name: `TEST balance ${Date.now()}`, balance: 0 },
  });
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const tx = await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      type: TransactionType.ACCOUNT_BALANCE,
      amount: 0,
      status: 'PENDING',
      transactionType: TransactionType.ACCOUNT_BALANCE,
      conversationId: `AG_B_${unique}`,
      originatorConversationId: `OC_B_${unique}`,
      transactionDesc: 'test balance',
    },
  });

  try {
    const callback = {
      Result: {
        ResultType: 0,
        ResultCode: 0,
        ResultDesc: 'The service request is processed successfully.',
        OriginatorConversationID: tx.originatorConversationId!,
        ConversationID: tx.conversationId!,
        TransactionID: 'SAG1TESTBAL1',
        ResultParameters: {
          ResultParameter: [
            {
              Key: 'AccountBalance',
              Value: 'Working Account|KES|481000.00|481000.00|1648377559000, Utility Account|KES|91428.50|91428.50|1648377559000',
            },
            { Key: 'BOCompletedTime', Value: 1648377559000 },
          ],
        },
        ReferenceData: { ReferenceItem: [{ Key: 'QueueTimeoutURL' }] },
      },
    };

    const result = await handleAccountBalanceCallback(callback);
    assertEqual(result.success, true, 'balance callback processed');

    const txAfter = await prisma.transaction.findUniqueOrThrow({ where: { id: tx.id } });
    assertEqual(txAfter.status, 'SUCCESS', 'balance query marked SUCCESS');
    const meta = txAfter.metadata ? JSON.parse(txAfter.metadata) : null;
    assertEqual(meta?.workingAccountBalance, 481000, 'metadata working balance');
    assertEqual(meta?.utilityAccountBalance, 91428.5, 'metadata utility balance');
    assertEqual(meta?.accounts?.length, 2, 'metadata accounts list');
  } finally {
    await prisma.transaction.deleteMany({ where: { walletId: wallet.id } });
    await prisma.wallet.deleteMany({ where: { id: wallet.id } });
    console.log('Throwaway rows removed.');
  }
}

async function main() {
  await testTransferCallback('working');
  await testTransferCallback('utility');
  await testBalanceParsing();
  console.log('\nALL ACCOUNT TRANSFER TESTS PASSED');
}

main()
  .catch((e) => {
    console.error('TEST FAILED:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
