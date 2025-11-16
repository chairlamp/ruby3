import { identity48, compose48, transpose48, validate48, type Perm48 } from "./perm";
import { idOf, type Face } from "./indexing";

type Coord = [Face, number, number];

const ring = (face: Face): Coord[] => [
  [face, -1, 1],
  [face, 0, 1],
  [face, 1, 1],
  [face, 1, 0],
  [face, 1, -1],
  [face, 0, -1],
  [face, -1, -1],
  [face, -1, 0]
];

const rows = (face: Face, j: number): Coord[] => [
  [face, -1, j],
  [face, 0, j],
  [face, 1, j]
];

const cols = (face: Face, i: number): Coord[] => [
  [face, i, 1],
  [face, i, 0],
  [face, i, -1]
];

const FACE_RING: Record<Face, Coord[]> = {
  U: ring("U"),
  D: ring("D"),
  F: ring("F"),
  B: ring("B"),
  R: ring("R"),
  L: ring("L")
};

const BELT_RING: Record<Face, Coord[]> = {
  U: [...rows("F", 1), ...rows("R", 1), ...rows("B", 1), ...rows("L", 1)],
  D: [...rows("F", -1), ...rows("L", -1), ...rows("B", -1), ...rows("R", -1)],
  F: [...rows("U", -1), ...cols("R", -1), ...rows("D", 1), ...cols("L", 1)],
  B: [...rows("U", 1), ...cols("L", -1), ...rows("D", -1), ...cols("R", 1)],
  R: [...cols("U", 1), ...cols("B", -1), ...cols("D", 1), ...cols("F", 1)],
  L: [...cols("U", -1), ...cols("F", -1), ...cols("D", -1), ...cols("B", 1)]
};

const FACE_RING_IDX: Record<Face, number[]> = Object.fromEntries(
  (Object.keys(FACE_RING) as Face[]).map((face) => [face, FACE_RING[face].map(([f, i, j]) => idOf(f, i, j))])
) as Record<Face, number[]>;

const BELT_RING_IDX: Record<Face, number[]> = Object.fromEntries(
  (Object.keys(BELT_RING) as Face[]).map((face) => [face, BELT_RING[face].map(([f, i, j]) => idOf(f, i, j))])
) as Record<Face, number[]>;

function rotateCycle(indices: number[], step: number): (perm: Perm48) => void {
  return (perm: Perm48) => {
    const len = indices.length;
    for (let k = 0; k < len; k++) {
      const src = indices[k];
      const dst = indices[(k + step) % len];
      perm[dst] = src;
    }
  };
}

const APPLY_FACE = Object.fromEntries(
  (Object.keys(FACE_RING_IDX) as Face[]).map((face) => [face, rotateCycle(FACE_RING_IDX[face], 2)])
) as Record<Face, (perm: Perm48) => void>;

const APPLY_BELT = Object.fromEntries(
  (Object.keys(BELT_RING_IDX) as Face[]).map((face) => [face, rotateCycle(BELT_RING_IDX[face], 3)])
) as Record<Face, (perm: Perm48) => void>;

const CACHE = new Map<Face, Perm48>();

export function quarter(face: Face): Perm48 {
  let perm = CACHE.get(face);
  if (!perm) {
    perm = identity48();
    APPLY_FACE[face](perm);
    APPLY_BELT[face](perm);
    validate48(perm);
    CACHE.set(face, perm);
  }
  return perm;
}

export function prime(face: Face): Perm48 {
  return transpose48(quarter(face));
}

export function double(face: Face): Perm48 {
  const q = quarter(face);
  return compose48(q, q);
}
