export type Axis4 = 0 | 1 | 2 | 3;
export type V4 = [number, number, number, number];
export type M4 = Float64Array;

export function v4(x = 0, y = 0, z = 0, w = 0): V4 {
  return [x, y, z, w];
}

export function cloneV4(a: V4): V4 {
  return [a[0], a[1], a[2], a[3]];
}

export function dot4(a: V4, b: V4): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}

export function norm4(a: V4): number {
  return Math.hypot(a[0], a[1], a[2], a[3]);
}

export function identity4(): M4 {
  const m = new Float64Array(16);
  m[0] = 1;
  m[5] = 1;
  m[10] = 1;
  m[15] = 1;
  return m;
}

export function transpose4(A: M4): M4 {
  const AT = new Float64Array(16);
  AT[0] = A[0];
  AT[1] = A[4];
  AT[2] = A[8];
  AT[3] = A[12];
  AT[4] = A[1];
  AT[5] = A[5];
  AT[6] = A[9];
  AT[7] = A[13];
  AT[8] = A[2];
  AT[9] = A[6];
  AT[10] = A[10];
  AT[11] = A[14];
  AT[12] = A[3];
  AT[13] = A[7];
  AT[14] = A[11];
  AT[15] = A[15];
  return AT;
}

export function mul4(A: M4, B: M4): M4 {
  const C = new Float64Array(16);
  for (let r = 0; r < 4; r++) {
    const r4 = r * 4;
    for (let c = 0; c < 4; c++) {
      C[r4 + c] =
        A[r4 + 0] * B[0 + c] +
        A[r4 + 1] * B[4 + c] +
        A[r4 + 2] * B[8 + c] +
        A[r4 + 3] * B[12 + c];
    }
  }
  return C;
}

export function mul4v(A: M4, v: V4): V4 {
  return [
    A[0] * v[0] + A[1] * v[1] + A[2] * v[2] + A[3] * v[3],
    A[4] * v[0] + A[5] * v[1] + A[6] * v[2] + A[7] * v[3],
    A[8] * v[0] + A[9] * v[1] + A[10] * v[2] + A[11] * v[3],
    A[12] * v[0] + A[13] * v[1] + A[14] * v[2] + A[15] * v[3],
  ];
}

export function rotPlane(i: Axis4, j: Axis4, theta: number): M4 {
  if (i === j) throw new Error("rotPlane: i and j must differ");
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const M = identity4();
  M[i * 4 + i] = c;
  M[j * 4 + j] = c;
  M[i * 4 + j] = -s;
  M[j * 4 + i] = s;
  return M;
}

export function rotDouble(i: Axis4, j: Axis4, theta: number, k: Axis4, l: Axis4, phi: number): M4 {
  const A = rotPlane(i, j, theta);
  const B = rotPlane(k, l, phi);
  return mul4(B, A);
}

export function isOrthonormal4(R: M4, eps = 1e-9): boolean {
  const I = identity4();
  const RT = transpose4(R);
  const P = mul4(RT, R);
  for (let t = 0; t < 16; t++) {
    if (Math.abs(P[t] - I[t]) > eps) return false;
  }
  return true;
}

export function det4(m: M4): number {
  const m00 = m[0],
    m01 = m[1],
    m02 = m[2],
    m03 = m[3];
  const m10 = m[4],
    m11 = m[5],
    m12 = m[6],
    m13 = m[7];
  const m20 = m[8],
    m21 = m[9],
    m22 = m[10],
    m23 = m[11];
  const m30 = m[12],
    m31 = m[13],
    m32 = m[14],
    m33 = m[15];

  const subFactor00 = m22 * m33 - m23 * m32;
  const subFactor01 = m21 * m33 - m23 * m31;
  const subFactor02 = m21 * m32 - m22 * m31;
  const subFactor03 = m20 * m33 - m23 * m30;
  const subFactor04 = m20 * m32 - m22 * m30;
  const subFactor05 = m20 * m31 - m21 * m30;

  const cof00 = +(m11 * subFactor00 - m12 * subFactor01 + m13 * subFactor02);
  const cof01 = -(m10 * subFactor00 - m12 * subFactor03 + m13 * subFactor04);
  const cof02 = +(m10 * subFactor01 - m11 * subFactor03 + m13 * subFactor05);
  const cof03 = -(m10 * subFactor02 - m11 * subFactor04 + m12 * subFactor05);

  return m00 * cof00 + m01 * cof01 + m02 * cof02 + m03 * cof03;
}
