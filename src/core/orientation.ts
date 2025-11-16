import { type Face } from "./facelets";
import type { Perm48 } from "./perm";

/** Orientation state */
export interface OriState {
  e: Uint8Array; // 12 edges, values in {0,1}
  c: Uint8Array; // 8 corners, values in {0,1,2}
}

export function solvedOri(): OriState {
  return { e: new Uint8Array(12), c: new Uint8Array(8) };
}

export function edgeDelta(face: Face): 0 | 1 {
  return face === "F" || face === "B" ? 1 : 0;
}

export function cornerDelta(face: Face): -1 | 0 | 1 {
  if (face === "U" || face === "D") return 0;
  return face === "F" || face === "R" ? 1 : -1;
}

export function applyQuarterOri(_face: Face, ori: OriState, _perm48: Perm48): OriState {
  return {
    e: ori.e.slice(),
    c: ori.c.slice(),
  };
}
