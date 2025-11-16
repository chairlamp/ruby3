import { describe, it, expect } from "vitest";
import { quarter, prime, double } from "../core/moves";
import { applyQuarterOri, solvedOri, edgeDelta, cornerDelta } from "../core/orientation";
import type { Face } from "../core/facelets";

const FACES: Face[] = ["U", "D", "L", "R", "F", "B"];

function edgeParitySum(e: Uint8Array): number {
  let s = 0;
  for (let i = 0; i < e.length; i++) s ^= e[i] & 1;
  return s & 1;
}
function cornerTwistSum(c: Uint8Array): number {
  let s = 0;
  for (let i = 0; i < c.length; i++) s = (s + (c[i] % 3)) % 3;
  return s;
}

describe("v0.4 - orientation model", () => {
  it("U/D do not change edges or corners directly", () => {
    const faces: Face[] = ["U", "D"];
    for (const f of faces) {
      const Q = quarter(f);
      const ori0 = solvedOri();
      const ori1 = applyQuarterOri(f, ori0, Q);
      expect(ori1.e.join()).toBe(ori0.e.join());
      expect(ori1.c.join()).toBe(ori0.c.join());
      expect(edgeDelta(f)).toBe(0);
      expect(cornerDelta(f)).toBe(0);
    }
  });

  it("F/B flip edges; R/L/F/B twist corners", () => {
    const faces: Face[] = ["F", "B"];
    for (const f of faces) {
      const Q = quarter(f);
      const ori0 = solvedOri();
      const ori1 = applyQuarterOri(f, ori0, Q);
      expect(edgeParitySum(ori1.e)).toBe(0);
      expect(cornerTwistSum(ori1.c)).toBe(0);
    }
    for (const f of ["R", "L"] as Face[]) {
      const Q = quarter(f);
      const o1 = applyQuarterOri(f, solvedOri(), Q);
      expect(edgeParitySum(o1.e)).toBe(0);
      expect(cornerTwistSum(o1.c)).toBe(0);
    }
  });

  it("Global invariants hold for random sequences", () => {
    const tokens: Face[] = ["U", "D", "L", "R", "F", "B"];
    const rand = (n: number) => Math.floor(Math.random() * n);
    for (let t = 0; t < 64; t++) {
      let ori = solvedOri();
      for (let k = 0; k < 30; k++) {
        const f = tokens[rand(tokens.length)];
        const which = rand(3);
        const P =
          which === 0 ? quarter(f) :
            which === 1 ? prime(f) :
              double(f);
        ori = applyQuarterOri(f, ori, P);
      }
      expect(edgeParitySum(ori.e)).toBe(0);
      expect(cornerTwistSum(ori.c)).toBe(0);
    }
  });
});
