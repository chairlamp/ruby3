export const STATE_LEN = 48;
export type Perm48 = Uint16Array;

export function identity48(): Perm48 {
  const p = new Uint16Array(STATE_LEN);
  for (let i = 0; i < STATE_LEN; i++) p[i] = i;
  return p;
}

/** (A ∘ B)(i) = A[B[i]] */
export function compose48(A: Perm48, B: Perm48): Perm48 {
  if (A.length !== STATE_LEN || B.length !== STATE_LEN) throw new RangeError("perm length != 48");
  const C = new Uint16Array(STATE_LEN);
  for (let i = 0; i < STATE_LEN; i++) C[i] = A[B[i]];
  return C;
}

export function transpose48(P: Perm48): Perm48 {
  const PT = new Uint16Array(STATE_LEN);
  for (let i = 0; i < STATE_LEN; i++) PT[P[i]] = i;
  return PT;
}

export function validate48(P: Perm48): void {
  if (P.length !== STATE_LEN) throw new RangeError("perm length != 48");
  const seen = new Uint8Array(STATE_LEN);
  for (let i = 0; i < STATE_LEN; i++) {
    const v = P[i];
    if (v < 0 || v >= STATE_LEN) throw new RangeError(`perm[${i}] out of range: ${v}`);
    if (seen[v]) throw new Error(`perm not bijection: duplicate ${v}`);
    seen[v] = 1;
  }
}

export function isIdentity48(P: Perm48): boolean {
  for (let i = 0; i < STATE_LEN; i++) if (P[i] !== i) return false;
  return true;
}
