import * as THREE from "three";

export function configureRenderer(renderer: THREE.WebGLRenderer) {
  (renderer as any).outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2));
  const gl = renderer.getContext();
  if (gl && typeof (gl as any).lineWidth === "function") {
    (gl as any).lineWidth(1);
  }
}
