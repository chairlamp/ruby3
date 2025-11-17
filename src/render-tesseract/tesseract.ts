import * as THREE from "three";
import { rotPlane, type Axis4 } from "../core-r4";

export type DoublePlane = { i: Axis4; j: Axis4; k: Axis4; l: Axis4 };

export function createTesseract(initial: DoublePlane) {
  const verts4: number[] = [];
  for (let a = -1; a <= 1; a += 2)
    for (let b = -1; b <= 1; b += 2)
      for (let c = -1; c <= 1; c += 2)
        for (let d = -1; d <= 1; d += 2)
          verts4.push(a, b, c, d);

  const edges: number[] = [];
  const idx = (x: -1 | 1, y: -1 | 1, z: -1 | 1, w: -1 | 1) =>
    ((x + 1) / 2) * 8 + ((y + 1) / 2) * 4 + ((z + 1) / 2) * 2 + ((w + 1) / 2);

  for (const x of [-1, 1] as const)
    for (const y of [-1, 1] as const)
      for (const z of [-1, 1] as const)
        for (const w of [-1, 1] as const) {
          const a = idx(x, y, z, w);
          if (x === -1) edges.push(a, idx(1, y, z, w));
          if (y === -1) edges.push(a, idx(x, 1, z, w));
          if (z === -1) edges.push(a, idx(x, y, 1, w));
          if (w === -1) edges.push(a, idx(x, y, z, 1));
        }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position4D", new THREE.BufferAttribute(new Float32Array(verts4), 4));
  geom.setIndex(edges);
  geom.setAttribute("position", new THREE.BufferAttribute(new Float32Array((verts4.length / 4) * 3), 3));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uR1: { value: new THREE.Matrix4().identity() },
      uR2: { value: new THREE.Matrix4().identity() },
      uScale: { value: 1.0 },
    },
    vertexShader: `
      attribute vec4 position4D;
      uniform mat4 uR1, uR2;
      uniform float uScale;
      void main() {
        vec4 p4 = uR2 * uR1 * position4D;
        vec3 p3 = p4.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p3 * uScale, 1.0);
      }`,
    fragmentShader: `void main(){ gl_FragColor = vec4(0.90, 0.94, 1.0, 1.0); }`,
    linewidth: 1,
  });

  const lines = new THREE.LineSegments(geom, mat);
  lines.frustumCulled = false;

  let planes = { ...initial };
  let theta = 0;
  let phi = 0;

  const toTHREE = (m: Float64Array) =>
    new THREE.Matrix4().set(
      m[0], m[4], m[8], m[12],
      m[1], m[5], m[9], m[13],
      m[2], m[6], m[10], m[14],
      m[3], m[7], m[11], m[15]
    );

  function setAngles(th: number, ph: number) {
    theta = th;
    phi = ph;
    const A = rotPlane(planes.i, planes.j, theta);
    const B = rotPlane(planes.k, planes.l, phi);
    (mat.uniforms.uR1.value as THREE.Matrix4).copy(toTHREE(A));
    (mat.uniforms.uR2.value as THREE.Matrix4).copy(toTHREE(B));
  }

  function setPlanes(p: DoublePlane) {
    planes = { ...p };
    setAngles(theta, phi);
  }

  return { object3d: lines, setAngles, setPlanes };
}
