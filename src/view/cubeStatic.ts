import * as THREE from "three";

/** Standard palette (Up white, Down yellow, Front green, Back blue, Right red, Left orange). */
export const FACE_COLORS = {
  U: 0xffffff,
  D: 0xffd500,
  F: 0x009b48,
  B: 0x0046ad,
  R: 0xb71234,
  L: 0xff5800
};

const CUBE_UNITS = 3;
const CELL = 1;
const HALF = (CUBE_UNITS * CELL) / 2;
const GUTTER = 0.1;
const EPS = 0.012;
const STICKER_THICK = 0.02;

type FaceDef = {
  key: keyof typeof FACE_COLORS;
  u: THREE.Vector3; // local X on face
  v: THREE.Vector3; // local Y on face
  n: THREE.Vector3; // outward normal
};

const FACES: FaceDef[] = [
  { key: "U", u: new THREE.Vector3(1, 0, 0), v: new THREE.Vector3(0, 0, -1), n: new THREE.Vector3(0, 1, 0) },
  { key: "D", u: new THREE.Vector3(1, 0, 0), v: new THREE.Vector3(0, 0, 1), n: new THREE.Vector3(0, -1, 0) },
  { key: "F", u: new THREE.Vector3(1, 0, 0), v: new THREE.Vector3(0, 1, 0), n: new THREE.Vector3(0, 0, 1) },
  { key: "B", u: new THREE.Vector3(-1, 0, 0), v: new THREE.Vector3(0, 1, 0), n: new THREE.Vector3(0, 0, -1) },
  { key: "R", u: new THREE.Vector3(0, 0, -1), v: new THREE.Vector3(0, 1, 0), n: new THREE.Vector3(1, 0, 0) },
  { key: "L", u: new THREE.Vector3(0, 0, 1), v: new THREE.Vector3(0, 1, 0), n: new THREE.Vector3(-1, 0, 0) }
];

/** Static solved cube using 6 InstancedMeshes (one per face), 9 instances each. */
export function createSolvedCubeGroup(): THREE.Group {
  const group = new THREE.Group();

  // Core (dark box slightly smaller than 3 units to form gaps)
  const coreGeom = new THREE.BoxGeometry(
    CUBE_UNITS - GUTTER * 0.25,
    CUBE_UNITS - GUTTER * 0.25,
    CUBE_UNITS - GUTTER * 0.25
  );
  const coreMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9, metalness: 0.0 });
  group.add(new THREE.Mesh(coreGeom, coreMat));

  // Shared plane geometry for stickers
  const stickerGeom = new THREE.PlaneGeometry(1, 1);

  const cellSize = CELL;
  const stickerSize = cellSize - GUTTER;

  // temp objects
  const tmpMat = new THREE.Matrix4();
  const tmpBasis = new THREE.Matrix4();
  const tmpQuat = new THREE.Quaternion();
  const tmpPos = new THREE.Vector3();
  const tmpScale = new THREE.Vector3();

  for (const face of FACES) {
    // Per-face material with face tint (avoids instanceColor path entirely)
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(FACE_COLORS[face.key]),
      roughness: 0.4,
      metalness: 0.0
    });

    const instanced = new THREE.InstancedMesh(stickerGeom, mat, 9);
    instanced.instanceMatrix.setUsage(THREE.StaticDrawUsage);

    // Precompute face orientation
    tmpBasis.makeBasis(face.u, face.v, face.n);
    tmpQuat.setFromRotationMatrix(tmpBasis);
    const faceCenter = face.n.clone().multiplyScalar(HALF + EPS);

    let idx = 0;
    for (let j = 0; j < 3; j++) {
      for (let i = 0; i < 3; i++) {
        const gx = i - 1;
        const gy = j - 1;
        const offsetU = face.u.clone().multiplyScalar(gx * cellSize);
        const offsetV = face.v.clone().multiplyScalar(gy * cellSize);

        tmpPos.copy(faceCenter).add(offsetU).add(offsetV);
        tmpScale.set(stickerSize, stickerSize, STICKER_THICK);

        tmpMat.compose(tmpPos, tmpQuat, tmpScale);
        instanced.setMatrixAt(idx++, tmpMat);
      }
    }
    instanced.instanceMatrix.needsUpdate = true;
    group.add(instanced);
  }

  return group;
}
