import { STATE_LEN, State48, Perm48 } from "./types";

const STATE_MIN_VALUE = 1;
const STATE_MAX_VALUE = STATE_LEN;
const permSeenScratch = new Uint8Array(STATE_LEN);

/** Solved state s0 = [1,2,...,48] as per the paper (page 3). */
export const s0: State48 = (() => {
  const v = new Uint16Array(STATE_LEN);
  for (let i = 0; i < STATE_LEN; i++) v[i] = i + 1;
  return v;
})();

/** identity permutation of length 48: id[i] = i */
export function identityPerm(): Perm48 {
  const p = new Uint16Array(STATE_LEN);
  for (let i = 0; i < STATE_LEN; i++) p[i] = i;
  return p;
}

/** Validate that state is 48-long and entries lie in 1..48. */
export function validateState(s: State48): void {
  if (s.length !== STATE_LEN) throw new RangeError(`state length ${s.length} != ${STATE_LEN}`);
  for (let i = 0; i < STATE_LEN; i++) {
    const v = s[i];
    if (v < STATE_MIN_VALUE || v > STATE_MAX_VALUE) {
      throw new RangeError(`state[${i}] out of range: ${v}`);
    }
  }
}

/** Validate permutation: correct length, values are 0..47, all unique. */
export function validatePermutation(p: Perm48): void {
  if (p.length !== STATE_LEN) throw new RangeError(`perm length ${p.length} != ${STATE_LEN}`);
  permSeenScratch.fill(0);
  for (let i = 0; i < STATE_LEN; i++) {
    const v = p[i];
    if (v < 0 || v >= STATE_LEN) throw new RangeError(`perm[${i}] out of range: ${v}`);
    if (permSeenScratch[v]) throw new Error(`perm is not a bijection; duplicate value ${v}`);
    permSeenScratch[v] = 1;
  }
}

/**
 * Apply permutation p to state s (s' = P*s as index remap).
 * Convention: dest[i] = s[p[i]].
 * Returns a NEW typed array; does not mutate inputs.
 */
export function applyPermutation(s: State48, p: Perm48): State48 {
  validateState(s);
  validatePermutation(p);
  const out = new Uint16Array(STATE_LEN);
  for (let i = 0; i < STATE_LEN; i++) out[i] = s[p[i]];
  return out;
}
