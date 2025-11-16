/**
 * 54-facelet layout (Kociemba-style base indices):
 * U: 0..8, R: 9..17, F: 18..26, D: 27..35, L: 36..44, B: 45..53
 * We REMOVE the 6 centers (4, 13, 22, 31, 40, 49) to get the 48-length state.
 *
 * We generate a 54→54 permutation for a quarter turn "clockwise looking at the face",
 * then compress it to a 48→48 permutation via moving-facelet indices.
 * Centers remain fixed by construction (p. 2 “Centers do not move”).
 */

export type Face = "U" | "D" | "L" | "R" | "F" | "B";

const FACE_BASE: Record<Face, number> = {
  U: 0,
  R: 9,
  F: 18,
  D: 27,
  L: 36,
  B: 45
};

export const CENTER_FACELETS = [4, 13, 22, 31, 40, 49];

export const MOVING_FACELETS: number[] = (() => {
  const a: number[] = [];
  for (let i = 0; i < 54; i++) if (!CENTER_FACELETS.includes(i)) a.push(i);
  return a;
})();

export function faceletToCoord(idx: number): { face: Face; i: number; j: number } {
  if (idx < 0 || idx >= 54) throw new RangeError("facelet idx out of range");
  const faceOrder: Face[] = ["U", "R", "F", "D", "L", "B"];
  const fIdx = Math.floor(idx / 9);
  const k = idx % 9;
  const j = Math.floor(k / 3);
  const i = k % 3;
  return { face: faceOrder[fIdx], i, j };
}

export function coordToFacelet(face: Face, i: number, j: number): number {
  return FACE_BASE[face] + j * 3 + i;
}

type V3 = [number, number, number];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export const BASIS: Record<Face, { u: V3; v: V3; n: V3 }> = {
  U: { u: [1, 0, 0], v: [0, 0, -1], n: [0, 1, 0] },
  D: { u: [1, 0, 0], v: [0, 0, 1], n: [0, -1, 0] },
  F: { u: [1, 0, 0], v: [0, 1, 0], n: [0, 0, 1] },
  B: { u: [-1, 0, 0], v: [0, 1, 0], n: [0, 0, -1] },
  R: { u: [0, 0, -1], v: [0, 1, 0], n: [1, 0, 0] },
  L: { u: [0, 0, 1], v: [0, 1, 0], n: [-1, 0, 0] }
};

function faceletPos(face: Face, i: number, j: number): V3 {
  const { u, v, n } = BASIS[face];
  const iOff = i - 1;
  const jOff = 1 - j;
  return add(mul(n, 1), add(mul(u, iOff), mul(v, jOff)));
}

function faceFromPos(p: V3): Face {
  const [x, y, z] = p;
  if (Math.abs(y) === 1) return y > 0 ? "U" : "D";
  if (Math.abs(x) === 1) return x > 0 ? "R" : "L";
  return z > 0 ? "F" : "B";
}

function ijFromPosOnFace(p: V3, face: Face): { i: number; j: number } {
  const { u, v, n } = BASIS[face];
  const pn: V3 = [p[0] - n[0], p[1] - n[1], p[2] - n[2]];
  const du = dot(pn, u);
  const dv = dot(pn, v);
  return { i: du + 1, j: dv + 1 };
}

function rotY(p: V3, sign: 1 | -1): V3 {
  const [x, y, z] = p;
  return sign === 1 ? [z, y, -x] : [-z, y, x];
}
function rotX(p: V3, sign: 1 | -1): V3 {
  const [x, y, z] = p;
  return sign === 1 ? [x, -z, y] : [x, z, -y];
}
function rotZ(p: V3, sign: 1 | -1): V3 {
  const [x, y, z] = p;
  return sign === 1 ? [-y, x, z] : [y, -x, z];
}

const LAYER_AXIS: Record<Face, "x" | "y" | "z"> = {
  U: "y",
  D: "y",
  R: "x",
  L: "x",
  F: "z",
  B: "z"
};
const LAYER_VAL: Record<Face, 1 | -1> = {
  U: 1,
  D: -1,
  R: 1,
  L: -1,
  F: 1,
  B: -1
};
const ROT_SIGN: Record<Face, 1 | -1> = {
  U: -1,
  R: -1,
  F: -1,
  D: 1,
  L: 1,
  B: 1
};

export function perm54Quarter(face: Face): Uint8Array {
  const P = new Uint8Array(54);
  for (let idx = 0; idx < 54; idx++) {
    const { face: f0, i, j } = faceletToCoord(idx);
    const p0 = faceletPos(f0, i, j);
    const axis = LAYER_AXIS[face];
    const val = LAYER_VAL[face];
    const sign = ROT_SIGN[face];
    const onLayer =
      (axis === "x" && p0[0] === val) ||
      (axis === "y" && p0[1] === val) ||
      (axis === "z" && p0[2] === val);
    const p1: V3 = onLayer
      ? axis === "x"
        ? (rotX(p0, sign) as V3)
        : axis === "y"
        ? (rotY(p0, sign) as V3)
        : (rotZ(p0, sign) as V3)
      : p0;
    const f1 = faceFromPos(p1);
    const { i: i1, j: j1 } = ijFromPosOnFace(p1, f1);
    P[idx] = coordToFacelet(f1, i1, j1);
  }
  return P;
}

let loggedMoving = false;
export function toPerm48From54(P54: Uint8Array): Uint16Array {
  const indexOfFacelet = new Map<number, number>();
  MOVING_FACELETS.forEach((f, j) => indexOfFacelet.set(f, j));
  if (!loggedMoving) {
    loggedMoving = true;
    console.error("moving len", MOVING_FACELETS.length, MOVING_FACELETS.slice(0, 16));
  }
  const P48 = new Uint16Array(48);
  for (let j = 0; j < 48; j++) {
    const srcIndex = j;
    const f = MOVING_FACELETS[srcIndex];
    const destFacelet = P54[f];
    const destIndex = indexOfFacelet.get(destFacelet);
    if (destIndex === undefined) {
      throw new Error(`facelet ${destFacelet} not found in moving set`);
    }
    P48[destIndex] = srcIndex;
  }
  return P48;
}
