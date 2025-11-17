import { describe, it, expect } from "vitest";
import {
  v4,
  identity4,
  mul4,
  mul4v,
  rotPlane,
  transpose4,
  isOrthonormal4,
  det4,
  type V4,
} from "../core-r4";

const EPS = 1e-9;

function approx(a: number, b: number, eps = EPS) {
  expect(Math.abs(a - b)).toBeLessThanOrEqual(eps);
}

function approxV(a: V4, b: V4, eps = EPS) {
  approx(a[0], b[0], eps);
  approx(a[1], b[1], eps);
  approx(a[2], b[2], eps);
  approx(a[3], b[3], eps);
}

describe("E-v0.1 — 4D primitives (R_ij(θ))", () => {
  it("identity4 behaves as identity", () => {
    const I = identity4();
    const e0: V4 = [1, 0, 0, 0];
    const e1: V4 = [0, 1, 0, 0];
    const e2: V4 = [0, 0, 1, 0];
    const e3: V4 = [0, 0, 0, 1];
    approxV(mul4v(I, e0), e0);
    approxV(mul4v(I, e1), e1);
    approxV(mul4v(I, e2), e2);
    approxV(mul4v(I, e3), e3);
  });

  it("R_ij(0) = I; R_ij(θ)·R_ij(−θ) = I; orthonormal with det≈1", () => {
    const R0 = rotPlane(0, 1, 0);
    const I = identity4();
    for (let t = 0; t < 16; t++) approx(R0[t], I[t]);

    const theta = Math.PI * 0.37;
    const R = rotPlane(2, 3, theta);
    const Rinv = rotPlane(2, 3, -theta);
    const P = mul4(R, Rinv);
    for (let t = 0; t < 16; t++) approx(P[t], I[t], 1e-8);

    expect(isOrthonormal4(R)).toBe(true);
    approx(det4(R), 1, 1e-8);
  });

  it("Acts as a 2×2 rotation on the chosen plane", () => {
    const theta = Math.PI / 6;
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    const R = rotPlane(1, 3, theta);

    const e1: V4 = [0, 1, 0, 0];
    const e3: V4 = [0, 0, 0, 1];

    approxV(mul4v(R, e1), [0, c, 0, s]);
    approxV(mul4v(R, e3), [0, -s, 0, c]);

    const v: V4 = [0, 2.0, 0, -1.5];
    const v2 = mul4v(R, v);
    const n1 = Math.hypot(v[1], v[3]);
    const n2 = Math.hypot(v2[1], v2[3]);
    approx(n1, n2, 1e-9);
  });

  it("Composition on same plane adds angles: R(θ)·R(φ) ≈ R(θ+φ)", () => {
    const th = 0.7;
    const ph = -0.35;
    const Rth = rotPlane(0, 2, th);
    const Rph = rotPlane(0, 2, ph);
    const Rsum = rotPlane(0, 2, th + ph);
    const P = mul4(Rph, Rth);
    for (let t = 0; t < 16; t++) approx(P[t], Rsum[t], 1e-9);
  });

  it("Transpose is inverse for plane rotations", () => {
    const th = 1.234;
    const R = rotPlane(0, 3, th);
    const RT = transpose4(R);
    const I = identity4();
    const P = mul4(RT, R);
    for (let t = 0; t < 16; t++) approx(P[t], I[t], 1e-8);
  });
});
