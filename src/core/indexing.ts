export type Face = "U" | "D" | "F" | "B" | "R" | "L";

export type V3 = { x: number; y: number; z: number };

export function v3(x: number, y: number, z: number): V3 {
  return { x, y, z };
}

export function add(a: V3, b: V3): V3 {
  return v3(a.x + b.x, a.y + b.y, a.z + b.z);
}

export function mul(a: V3, k: number): V3 {
  return v3(a.x * k, a.y * k, a.z * k);
}

export function dot(a: V3, b: V3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export const BASIS: Record<Face, { n: V3; u: V3; v: V3 }> = {
  U: { n: v3(0, 1, 0), u: v3(1, 0, 0), v: v3(0, 0, -1) },
  D: { n: v3(0, -1, 0), u: v3(1, 0, 0), v: v3(0, 0, 1) },
  F: { n: v3(0, 0, 1), u: v3(1, 0, 0), v: v3(0, 1, 0) },
  B: { n: v3(0, 0, -1), u: v3(-1, 0, 0), v: v3(0, 1, 0) },
  R: { n: v3(1, 0, 0), u: v3(0, 0, -1), v: v3(0, 1, 0) },
  L: { n: v3(-1, 0, 0), u: v3(0, 0, 1), v: v3(0, 1, 0) }
};

export const FACE_ORDER: Face[] = ["U", "D", "F", "B", "R", "L"];

export const FACE_LOCAL_COORDS: ReadonlyArray<[number, number]> = [
  [-1, 1],
  [0, 1],
  [1, 1],
  [-1, 0],
  [1, 0],
  [-1, -1],
  [0, -1],
  [1, -1]
];

const FACE_OFF: Record<Face, number> = { U: 0, D: 8, F: 16, B: 24, R: 32, L: 40 };

export function idOf(face: Face, i: number, j: number): number {
  const base = FACE_OFF[face];
  const k = FACE_LOCAL_COORDS.findIndex(([I, J]) => I === i && J === j);
  if (k < 0) throw new Error(`no coord (${i},${j}) on ${face}`);
  return base + k;
}

export function descOf(index: number): { face: Face; i: number; j: number } {
  if (index < 0 || index >= 48) throw new Error(`index OOB ${index}`);
  const face = FACE_ORDER[Math.floor(index / 8)]!;
  const [i, j] = FACE_LOCAL_COORDS[index % 8]!;
  return { face, i, j };
}

export function toGlobal(face: Face, i: number, j: number): V3 {
  const { n, u, v } = BASIS[face];
  return add(n, add(mul(u, i), mul(v, j)));
}

export function fromGlobal(p: V3): { face: Face; i: number; j: number } {
  if (p.y === 1) return projectTo("U", p);
  if (p.y === -1) return projectTo("D", p);
  if (p.z === 1) return projectTo("F", p);
  if (p.z === -1) return projectTo("B", p);
  if (p.x === 1) return projectTo("R", p);
  if (p.x === -1) return projectTo("L", p);
  throw new Error(`fromGlobal: not on a face plane: ${JSON.stringify(p)}`);
}

function projectTo(face: Face, p: V3) {
  const { n, u, v } = BASIS[face];
  const q = v3(p.x - n.x, p.y - n.y, p.z - n.z);
  return { face, i: dot(q, u), j: dot(q, v) };
}

export function rotate90CW(p: V3, axis: V3): V3 {
  const ax = axis.x !== 0 ? "X" : axis.y !== 0 ? "Y" : "Z";
  const s = (axis.x || axis.y || axis.z) > 0 ? 1 : -1;
  if (ax === "X") return v3(p.x, s * p.z, -s * p.y);
  if (ax === "Y") return v3(s * p.z, p.y, -s * p.x);
  return v3(s * p.y, -s * p.x, p.z);
}

export function rotate90CCW(p: V3, axis: V3): V3 {
  const ax = axis.x !== 0 ? "X" : axis.y !== 0 ? "Y" : "Z";
  const s = (axis.x || axis.y || axis.z) > 0 ? 1 : -1;
  if (ax === "X") return v3(p.x, -s * p.z, s * p.y);
  if (ax === "Y") return v3(-s * p.z, p.y, s * p.x);
  return v3(-s * p.y, s * p.x, p.z);
}
