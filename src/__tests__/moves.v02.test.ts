import { describe, it, expect } from "vitest";
import { quarter, prime, double } from "../core/moves";

function isIdentity(P: Uint16Array): boolean {
  for (let i = 0; i < P.length; i++) if (P[i] !== i) return false;
  return true;
}
function multiply(A: Uint16Array, B: Uint16Array): Uint16Array {
  const out = new Uint16Array(A.length);
  for (let i = 0; i < A.length; i++) out[i] = A[B[i]];
  return out;
}
function transpose(P: Uint16Array): Uint16Array {
  const PT = new Uint16Array(P.length);
  for (let i = 0; i < P.length; i++) PT[P[i]] = i;
  return PT;
}

describe("v0.2 — face turns as permutations (48-index)", () => {
  const faces: Array<"U" | "D" | "L" | "R" | "F" | "B"> = ["U", "D", "L", "R", "F", "B"];

  it("P · P^T = I for each quarter turn (orthogonality, p. 3)", () => {
    for (const f of faces) {
      const P = quarter(f);
      const PT = transpose(P);
      expect(isIdentity(multiply(P, PT))).toBe(true);
    }
  });

  it("double equals quarter∘quarter; four quarters = identity", () => {
    for (const f of faces) {
      const Q = quarter(f);
      const Q2 = multiply(Q, Q);
      const Q3 = multiply(Q2, Q);
      const Q4 = multiply(Q3, Q);
      const D = double(f);
      expect(Array.from(D)).toEqual(Array.from(Q2));
      expect(isIdentity(Q4)).toBe(true);
    }
  });

  it("each quarter turn moves 20 stickers (8 on turning face + 12 on belt)", () => {
    for (const f of faces) {
      const P = quarter(f);
      let moved = 0;
      for (let i = 0; i < P.length; i++) if (P[i] !== i) moved++;
      expect(moved).toBe(20);
    }
  });
});
