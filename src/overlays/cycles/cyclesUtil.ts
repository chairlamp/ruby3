import { cyclesOf } from "../../core/cycles";
import type { Perm48 } from "../../core/perm";

export function computeCycles48(P: Perm48, opts?: { includeFixed?: boolean }): number[][] {
  if (P.length !== 48) throw new RangeError("perm length != 48");
  const includeFixed = opts?.includeFixed ?? true;
  const cycles: number[][] = [];
  const seen = new Uint8Array(P.length);

  for (let i = 0; i < P.length; i++) {
    if (seen[i]) continue;
    let j = i;
    const cyc: number[] = [];
    while (!seen[j]) {
      seen[j] = 1;
      cyc.push(j);
      j = P[j];
    }
    if (cyc.length > 1 || includeFixed) cycles.push(cyc);
  }
  cycles.sort((a, b) => b.length - a.length);
  return cycles;
}
