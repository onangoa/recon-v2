/**
 * Enroll ID assignment for biometric workers.
 *
 * Enroll IDs live in a small positive-integer namespace that is UNIQUE PER
 * DEVICE (mirroring the fingerprint backend's person table). IDs are assigned
 * by filling the first free slot of the target device: if 1, 2, 3 and 10 are
 * taken on that device, the next assignment is 4, then 5..9, and only then 11.
 */

/**
 * Return the smallest positive integer not present in `takenIds`.
 * Accepts numbers or numeric strings (the Worker.enrollId column is a
 * string); blank/null/NaN entries are ignored.
 */
export function nextFreeEnrollId(
  takenIds: Array<number | string | null | undefined>
): number {
  const taken = new Set<number>();
  for (const id of takenIds) {
    if (id === null || id === undefined) continue;
    if (typeof id === 'string' && id.trim() === '') continue;
    const num = typeof id === 'number' ? id : Number(id);
    if (Number.isFinite(num)) taken.add(num);
  }
  let candidate = 1;
  while (taken.has(candidate)) candidate += 1;
  return candidate;
}
