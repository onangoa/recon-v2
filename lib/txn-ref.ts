import Sqids from 'sqids';

// Friendly transaction references (TXN-xxxxxx) shown in the UI, derived from
// the Transaction.seq global sequence (AUTO_INCREMENT + UNIQUE, so the DB
// guarantees no two transactions share a number, and sqids is a bijection,
// so no two numbers share a string).
//
// FROZEN CONFIG: the prefix, alphabet and minLength below must never change
// once shipped. sqids is deterministic — changing any of these renames every
// existing reference, and a ref generated before the change would not decode
// after it. Uppercase letters + digits only, so refs are unambiguous when
// read aloud (no "is that a lowercase q?" on support calls). The blocklist
// is emptied so ref generation never depends on the library's word list.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const MIN_LENGTH = 6;

const sqids = new Sqids({ alphabet: ALPHABET, minLength: MIN_LENGTH, blocklist: new Set<string>() });

export const TXN_REF_PREFIX = 'TXN-';

/** Render a Transaction.seq as the user-facing reference, e.g. 123 -> TXN-xxxxxx. */
export function formatTxnRef(seq: number): string {
  return `${TXN_REF_PREFIX}${sqids.encode([seq])}`;
}

/**
 * Resolve a user-supplied TXN- reference (or bare encoded part, any case,
 * optional prefix) back to the Transaction.seq. Returns null for anything
 * that is not a valid reference. sqids decodes arbitrary strings to
 * spurious numbers, so the result is round-trip validated: it only parses
 * when re-encoding reproduces the input exactly. Callers must still scope
 * lookups to the authenticated contractor; a parsed seq is never an
 * authorisation.
 */
export function parseTxnRef(ref: string): number | null {
  const raw = ref.trim();
  const encoded = raw.toUpperCase().startsWith(TXN_REF_PREFIX)
    ? raw.slice(TXN_REF_PREFIX.length)
    : raw;
  if (!encoded) return null;
  // User input may arrive in any case; normalise it to the alphabet's case
  // (uppercase) before decoding, since sqids only maps characters that
  // exist in the configured alphabet.
  const normalized = encoded.toUpperCase();
  const [seq] = sqids.decode(normalized);
  if (typeof seq !== 'number' || seq <= 0) return null;
  return sqids.encode([seq]) === normalized ? seq : null;
}
