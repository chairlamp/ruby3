import { describe, it, expect } from "vitest";
import { identity48, compose48, transpose48, isIdentity48 } from "../core/perm";
import { quarter, prime, double } from "../core/moves";
import type { Face } from "../core/indexing";
import { parseMoves, type MoveToken } from "../ui/moveParser";

function rngMulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FACES: Face[] = ["U", "D", "L", "R", "F", "B"];
const SUFFIXES = ["", "'", "2"] as const;

function randomScrambleText(rng: () => number, len: number): string {
  const parts: string[] = [];
  for (let i = 0; i < len; i++) {
    const f = FACES[(rng() * FACES.length) | 0];
    const s = SUFFIXES[(rng() * SUFFIXES.length) | 0];
    parts.push(f + s);
  }
  return parts.join(" ");
}

function permOfToken(t: MoveToken) {
  if (t.power === 2) return double(t.face);
  return t.prime ? prime(t.face) : quarter(t.face);
}

function composeFromTokensArr(tokens: MoveToken[]): Uint16Array {
  return tokens.reduce((acc, tok) => compose48(acc, permOfToken(tok)), identity48());
}

function invertToken(t: MoveToken): MoveToken {
  if (t.power === 2) return { face: t.face, power: 2, prime: false };
  return { face: t.face, power: 1, prime: !t.prime };
}

function inverseTokens(tokens: MoveToken[]): MoveToken[] {
  const out: MoveToken[] = new Array(tokens.length);
  for (let i = 0; i < tokens.length; i++) {
    out[i] = invertToken(tokens[tokens.length - 1 - i]);
  }
  return out;
}

describe("I v0.2 — Property tests: random scrambles", () => {
  it("Random S: S^{-1}(S(s0)) = s0 (p. 3)", () => {
    const rng = rngMulberry32(0xc0ffee ^ 0xcafef00d);
    const TRIALS = 200;
    for (let k = 0; k < TRIALS; k++) {
      const len = 1 + ((rng() * 28) | 0);
      const text = randomScrambleText(rng, len);

      const tokens = parseMoves(text);
      const P = composeFromTokensArr(tokens);

      const tokensInv = inverseTokens(tokens);
      const PinvText = composeFromTokensArr(tokensInv);
      const PinvAlg = transpose48(P);

      expect(Array.from(PinvText)).toEqual(Array.from(PinvAlg));

      let state = compose48(identity48(), P);
      state = compose48(state, PinvText);
      expect(isIdentity48(state)).toBe(true);
    }
  });
});
