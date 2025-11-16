import { describe, it, expect } from "vitest";
import { STATE_LEN, s0, identityPerm, applyPermutation } from "../core";

function toArray(u: Uint16Array) {
  return Array.from(u);
}

describe("v0.1 — solved state and identity", () => {
  it("s0 is [1,2,...,48]", () => {
    expect(s0.length).toBe(STATE_LEN);
    const expected = Array.from({ length: STATE_LEN }, (_, i) => i + 1);
    expect(toArray(s0)).toEqual(expected);
  });

  it("identityPerm() has length 48 and maps i -> i", () => {
    const id = identityPerm();
    expect(id.length).toBe(STATE_LEN);
    for (let i = 0; i < STATE_LEN; i++) expect(id[i]).toBe(i);
  });

  it("apply(identity, s0) = s0 (no mutation, exact equality)", () => {
    const id = identityPerm();
    const out = applyPermutation(s0, id);
    expect(toArray(out)).toEqual(toArray(s0));
    expect(out).not.toBe(s0);
  });

  it("apply(identity, any state) returns the same contents", () => {
    const reversed = new Uint16Array(Array.from(s0).reverse());
    const id = identityPerm();
    const out = applyPermutation(reversed, id);
    expect(toArray(out)).toEqual(toArray(reversed));
  });
});
