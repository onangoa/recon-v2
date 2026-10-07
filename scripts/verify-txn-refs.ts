/**
 * Verifies lib/txn-ref.ts against the live DB: every Transaction.seq maps to
 * a unique TXN- reference, and parseTxnRef round-trips them back.
 */
import { prisma } from '../lib/prisma';
import { formatTxnRef, parseTxnRef } from '../lib/txn-ref';

async function main() {
  const txs = await prisma.transaction.findMany({ select: { seq: true }, orderBy: { seq: 'asc' } });
  const refs = txs.map((t) => formatTxnRef(t.seq));
  const unique = new Set(refs);

  console.log(`rows: ${txs.length}, unique refs: ${unique.size}`);
  console.log('sample:', refs.slice(0, 5).join(' '), '...', refs[refs.length - 1]);

  const idx = 10;
  const ref = refs[idx];
  console.log(`roundtrip: ${ref} -> ${parseTxnRef(ref)} (expect ${txs[idx].seq})`);
  console.log(`prefixless+uppercase: ${ref.slice(4).toUpperCase()} -> ${parseTxnRef(ref.slice(4).toUpperCase())} (expect ${txs[idx].seq})`);
  console.log('garbage ->', parseTxnRef('TXN-hello!'), parseTxnRef('TXN-'), parseTxnRef(''));

  if (unique.size !== txs.length) throw new Error('REF COLLISIONS DETECTED');
  if (parseTxnRef(ref) !== txs[idx].seq) throw new Error('roundtrip failed');
  console.log('\nTXN REF VERIFICATION PASSED');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
