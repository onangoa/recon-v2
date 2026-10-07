/**
 * Reproduces the B2B (paybill/till) SUCCESS callback locally with the EXACT
 * shape of the prod payout that succeeded without charging the KES 40 fee:
 * the real Daraja B2B callback carries only Currency + account balance
 * parameters — no TransactionAmount — so the wallet debit and the fee were
 * silently skipped. Creates a throwaway wallet + B2B transaction, feeds the
 * synthetic Daraja result through handleB2BCallback, and checks the amount
 * decrement, the PAYOUT_FEE row and the wallet balance afterwards. No M-Pesa
 * call is made. Pass --with-amount to also test the legacy shape that
 * includes TransactionAmount.
 */
import { prisma } from '../lib/prisma';
import { handleB2BCallback } from '../lib/mpesa-service';
import { getPayoutFee } from '../lib/payout-fee';

async function main() {
  const withAmount = process.argv.includes('--with-amount');
  const fee = await getPayoutFee();
  console.log(`Current payout fee: ${fee} (PlatformConfig may be unset -> default 40)`);

  const contractor = await prisma.contractor.findFirst();
  if (!contractor) {
    console.log('No contractor found — nothing to test against.');
    return;
  }

  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const wallet = await prisma.wallet.create({
    data: { name: 'TEST B2B fee', contractorId: contractor.id, balance: 1000 },
  });
  const tx = await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      type: 'debit',
      amount: 10,
      description: 'Test',
      reference: '4321107',
      status: 'PENDING',
      transactionType: 'B2B',
      accountReference: 'Test',
      transactionDesc: 'Test',
      remarks: 'paybill',
      conversationId: `AG_TEST_${uniqueSuffix}`,
      originatorConversationId: `1d4b-test-${uniqueSuffix}`,
    },
  });

  try {
    // Exact ResultParameter set from the prod B2B SUCCESS callback
    // (rawCallbackData of the 2026-09-29 till payout): Currency,
    // DebitAccountCurrentBalance, InitiatorAccountCurrentBalance —
    // NO TransactionAmount and NO TransactionReceipt.
    const resultParameters: any[] = [
      { Key: 'Currency', Value: 'KES' },
      {
        Key: 'DebitAccountCurrentBalance',
        Value: '{Amount={CurrencyCode=KES, MinimumAmount=93700, BasicAmount=937.00}}',
      },
      {
        Key: 'InitiatorAccountCurrentBalance',
        Value: '{Amount={CurrencyCode=KES, MinimumAmount=93700, BasicAmount=937.00}}',
      },
    ];
    if (withAmount) {
      resultParameters.unshift(
        { Key: 'TransactionReceipt', Value: 'UJ6S75773L' },
        { Key: 'TransactionAmount', Value: 10 }
      );
    }

    const callback = {
      Result: {
        ResultType: 0,
        ResultCode: 0,
        ResultDesc: 'The service request is processed successfully.',
        OriginatorConversationID: tx.originatorConversationId!,
        ConversationID: tx.conversationId!,
        TransactionID: 'NLJ7TESTTRANSACTION1',
        ResultParameters: { ResultParameter: resultParameters },
        ReferenceData: {
          ReferenceItem: [
            { Key: 'QueueTimeoutURL', Value: 'https://internalapi.safaricom.net/mpesa/b2bresults/v1/submit' },
            { Key: 'Occassion' },
          ],
        },
      },
    };

    console.log(`\n--- feeding synthetic B2B SUCCESS callback (TransactionAmount ${withAmount ? 'INCLUDED' : 'OMITTED — prod shape'}) ---`);
    const result = await handleB2BCallback(callback);
    console.log('handleB2BCallback returned:', JSON.stringify(result));

    const txAfter = await prisma.transaction.findUniqueOrThrow({ where: { id: tx.id } });
    const walletAfter = await prisma.wallet.findUniqueOrThrow({ where: { id: wallet.id } });
    const feeRow = await prisma.transaction.findFirst({
      where: { reference: `FEE-${tx.id}`, transactionType: 'PAYOUT_FEE' },
    });

    console.log('\npayout status:', txAfter.status, '(expected SUCCESS)');
    console.log('wallet balance:', walletAfter.balance, `(expected ${1000 - 10 - fee} = 990 amount + ${fee} fee)`);
    console.log('FEE row:', feeRow ? `amount ${feeRow.amount} status ${feeRow.status}` : 'MISSING!');

    if (txAfter.status !== 'SUCCESS') throw new Error('Payout was not marked SUCCESS');
    if (walletAfter.balance !== 1000 - 10 - fee) {
      throw new Error(`Wallet balance ${walletAfter.balance} != expected ${1000 - 10 - fee}`);
    }
    if (!feeRow) throw new Error('PAYOUT_FEE row was NOT created');

    console.log('\nFEE CHARGED CORRECTLY IN LOCAL REPRODUCTION');
  } finally {
    await prisma.transaction.deleteMany({ where: { walletId: wallet.id } });
    await prisma.wallet.deleteMany({ where: { id: wallet.id } });
    console.log('\nThrowaway wallet and transactions removed.');
  }
}

main()
  .catch((e) => {
    console.error('REPRODUCTION RESULT:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
