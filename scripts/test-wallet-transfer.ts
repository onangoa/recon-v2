/**
 * Sanity test for internal wallet-to-wallet transfers (run against the local
 * dev DB). Creates two throwaway wallets under an existing contractor,
 * funds the source wallet, runs WalletService.transferBetweenWallets,
 * asserts the balances/transaction pair, then removes the throwaway rows.
 */
import { prisma } from '../lib/prisma';
import { WalletService, WalletTransferError } from '../lib/wallet-service';

async function main() {
  const contractor = await prisma.contractor.findFirst({
    where: { wallets: { some: { id: { not: undefined } } } },
  });
  if (!contractor) {
    console.log('No contractor found — nothing to test against.');
    return;
  }
  console.log(`Using contractor: ${contractor.companyName}`);

  const source = await prisma.wallet.create({
    data: {
      name: 'TEST ITR Source',
      contractorId: contractor.id,
      balance: 5000,
    },
  });
  const destination = await prisma.wallet.create({
    data: {
      name: 'TEST ITR Destination',
      contractorId: contractor.id,
      balance: 1000,
    },
  });

  try {
    console.log('\n--- 1. happy path: transfer 1500 from source to destination ---');
    const result = await WalletService.transferBetweenWallets({
      sourceWalletId: source.id,
      destinationWalletId: destination.id,
      amount: 1500,
      description: 'Test internal transfer',
      contractorId: contractor.id,
    });
    const [srcAfter, dstAfter] = await Promise.all([
      prisma.wallet.findUniqueOrThrow({ where: { id: source.id } }),
      prisma.wallet.findUniqueOrThrow({ where: { id: destination.id } }),
    ]);
    console.log('transferRef:', result.transferRef);
    console.log('source balance:', srcAfter.balance, '(expected 3500)');
    console.log('destination balance:', dstAfter.balance, '(expected 2500)');
    if (srcAfter.balance !== 3500 || dstAfter.balance !== 2500) {
      throw new Error('Balances do not match expected values');
    }
    if (result.sourceBalance !== 3500 || result.destinationBalance !== 2500) {
      throw new Error('Returned balances do not match expected values');
    }
    const pair = await prisma.transaction.findMany({
      where: { reference: result.transferRef },
      orderBy: { type: 'asc' },
    });
    console.log('linked transaction rows:', pair.length, '(expected 2)');
    if (pair.length !== 2) throw new Error('Expected a debit/credit pair');
    const debit = pair.find((t) => t.type === 'debit')!;
    const credit = pair.find((t) => t.type === 'credit')!;
    if (
      debit.walletId !== source.id ||
      credit.walletId !== destination.id ||
      debit.status !== 'completed' ||
      credit.status !== 'completed' ||
      debit.transactionType !== 'INTERNAL_TRANSFER' ||
      debit.amount !== 1500
    ) {
      throw new Error('Transaction pair has unexpected values');
    }
    console.log('debit/credit pair verified (status, type, wallets, amount)');

    console.log('\n--- 2. insufficient balance is rejected ---');
    try {
      await WalletService.transferBetweenWallets({
        sourceWalletId: source.id,
        destinationWalletId: destination.id,
        amount: 999999,
        contractorId: contractor.id,
      });
      throw new Error('Expected insufficient-balance rejection');
    } catch (e: any) {
      if (!(e instanceof WalletTransferError) || e.status !== 400) throw e;
      console.log('rejected as expected:', e.message);
    }
    const unchanged = await prisma.wallet.findUniqueOrThrow({ where: { id: source.id } });
    if (unchanged.balance !== 3500) throw new Error('Source balance changed on failed transfer');

    console.log('\n--- 3. same-wallet transfer is rejected ---');
    try {
      await WalletService.transferBetweenWallets({
        sourceWalletId: source.id,
        destinationWalletId: source.id,
        amount: 100,
        contractorId: contractor.id,
      });
      throw new Error('Expected same-wallet rejection');
    } catch (e: any) {
      if (!(e instanceof WalletTransferError)) throw e;
      console.log('rejected as expected:', e.message);
    }

    console.log('\n--- 4. cross-contractor destination is rejected ---');
    const other = await prisma.wallet.findFirst({
      where: { contractorId: { not: contractor.id } },
    });
    if (other) {
      try {
        await WalletService.transferBetweenWallets({
          sourceWalletId: source.id,
          destinationWalletId: other.id,
          amount: 100,
          contractorId: contractor.id,
        });
        throw new Error('Expected foreign-wallet rejection');
      } catch (e: any) {
        if (!(e instanceof WalletTransferError) || e.status !== 404) throw e;
        console.log('rejected as expected:', e.message);
      }
    } else {
      console.log('(no foreign wallet in DB — skipped)');
    }

    console.log('\nALL TRANSFER TESTS PASSED');
  } finally {
    await prisma.transaction.deleteMany({ where: { walletId: { in: [source.id, destination.id] } } });
    await prisma.wallet.deleteMany({ where: { id: { in: [source.id, destination.id] } } });
    console.log('\nThrowaway wallets and transactions removed.');
  }
}

main()
  .catch((e) => {
    console.error('TEST FAILED:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
