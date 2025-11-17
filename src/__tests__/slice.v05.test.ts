import { describe, it, expect } from "vitest";
import { slabAlpha } from "../core-r4/slice";

describe("E‑v0.5 — slice alpha", () => {
  it("bright inside slab", () => {
    expect(slabAlpha(0.0, 0.0, 0.2)).toBeCloseTo(1, 6);
  });

  it("zero well outside slab", () => {
    expect(slabAlpha(1.0, 0.0, 0.2)).toBe(0);
  });

  it("symmetric about w0", () => {
    expect(slabAlpha(0.1, 0.0, 0.2)).toBeCloseTo(slabAlpha(-0.1, 0.0, 0.2), 6);
  });
});
