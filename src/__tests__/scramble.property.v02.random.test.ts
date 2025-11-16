import { describe, it, expect } from "vitest";
import { compose48, transpose48, identity48, applyPermutation } from "../core/perm";
import { quarter, prime, double } from "../core/moves";
import type { Face } from "../core/facelets";

const FACES: Face[] = ["U", "D", "L", "R", "F", "B"];
type Suffix = "" | "'" | "2";

function solved(): Uint16Array {
  const a = new Uint16Array(48);
  for (let i = 0; i < 48; i++) a[i] = i + 1;
  return a;
}

function permFor(face: Face, suf: Suffix) {
  switch (suf) {
    case "":
      return quarter(face);
    case "'":
      return prime(face);
    case "2":
      return double(face);
  }
}

function randomSeq(len: number): [Face, Suffix][] {
  const seq: [Face, Suffix][] = [];
  for (let i = 0; i < len; i++) {
    const f = FACES[(Math.random() * 6) | 0];
    const r = (Math.random() * 3) | 0;
    const s: Suffix = r === 0 ? "" : r === 1 ? "'" : "2";
    seq.push([f, s]);
  }
  return seq;
}

function product(seq: [Face, Suffix][]) {
  let P = identity48();
  for (const [f, s] of seq) P = compose48(permFor(f, s), P);
  return P;
}

describe("I-v0.2 — Property tests: random scrambles", () => {
  it("S^{-1}(S(s0)) = s0 for many random sequences", () => {
    for (let trial = 0; trial < 64; trial++) {
      const len = 1 + ((Math.random() * 24) | 0);
      const seq = randomSeq(len);

      const P = product(seq);
      const Pinv = transpose48(P);

      const s0 = solved();
      const after = applyPermutation(s0, P);
      const back = applyPermutation(after, Pinv);

      expect(Array.from(back)).toEqual(Array.from(s0));

      const I = compose48(P, Pinv);
      for (let i = 0; i < I.length; i++) expect(I[i]).toBe(i);
    }
  });
});
