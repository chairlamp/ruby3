import { describe, it, expect } from "vitest";
import { parseMoves, formatMoves } from "../ui/moveParser";

describe("move parser", () => {
  it("parses the sample scramble with Unicode prime (page 2)", () => {
    const seq = "F R U L D′ F B′ R U";
    const tokens = parseMoves(seq);
    expect(tokens.length).toBe(9);
    expect(formatMoves(tokens)).toBe("F R U L D' F B' R U");
  });

  it("parses ASCII prime/apostrophe and 2 suffix", () => {
    const seq = "R2 U' F2 B";
    const tokens = parseMoves(seq);
    expect(formatMoves(tokens)).toBe("R2 U' F2 B");
  });

  it("accepts rare order 'R'2 and R2' as equivalent", () => {
    expect(formatMoves(parseMoves("R'2"))).toBe("R2'");
    expect(formatMoves(parseMoves("R2'"))).toBe("R2'");
  });

  it("throws on invalid tokens", () => {
    expect(() => parseMoves("X Y Z")).toThrow();
  });
});
