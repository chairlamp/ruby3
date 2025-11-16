import { describe, it, expect } from "vitest";
import { compose48 } from "../core/perm";
import { quarter } from "../core/moves";
import { computeCycles48 } from "../overlays/cycles/cyclesUtil";
import { bucketByLength, sumBucketSizes } from "../core/eigens";
import type { Face } from "../core/facelets";

describe("C-v0.3 — eigen roots implied by cycles", () => {
  it("cycle bucket sizes change with nontrivial move", () => {
    const QF = quarter("F");
    const cycles = computeCycles48(QF);
    const byK = bucketByLength(cycles);
    const hasNontrivial = Array.from(byK.keys()).some((k) => k > 1);
    expect(hasNontrivial).toBe(true);
  });

  it("composition changes buckets deterministically", () => {
    const seq: Face[] = ["R", "U", "R"];
    const P = compose48(compose48(quarter(seq[0]), quarter(seq[1])), quarter(seq[2]));
    const cycles = computeCycles48(P);
    const byK = bucketByLength(cycles);
    const total = sumBucketSizes(byK);
    expect(total).toBe(48);
  });
});
