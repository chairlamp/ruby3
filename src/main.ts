import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { mountMoveUI } from "./ui/controls";
import { StickerSystem } from "./render/stickers";
import { parseMoves } from "./ui/moveParser";

const container = document.getElementById("app")!;

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
function configureColorManagement(r: THREE.WebGLRenderer) {
  const anyR = r as any;
  if ("outputColorSpace" in anyR) {
    anyR.outputColorSpace = (THREE as any).SRGBColorSpace;
    if ((THREE as any).ColorManagement) (THREE as any).ColorManagement.enabled = true;
  } else {
    anyR.outputEncoding = (THREE as any).sRGBEncoding;
    if ((THREE as any).ColorManagement) (THREE as any).ColorManagement.enabled = true;
  }
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.2;
  const ocs = anyR.outputColorSpace ?? "legacy-encoding";
  console.log("[color]", "outputColorSpace:", ocs);
}
configureColorManagement(renderer);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0e14);

const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(6, 4, 6);
camera.lookAt(0, 0, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const hemi = new THREE.HemisphereLight(0xffffff, 0x222233, 0.45);
hemi.position.set(0, 1, 0);
scene.add(hemi);

const key = new THREE.DirectionalLight(0xffffff, 1.6);
key.position.set(5, 7, 8);
key.castShadow = false;
scene.add(key);

const rim = new THREE.DirectionalLight(0xffffff, 0.9);
rim.position.set(-6, 3, -5);
scene.add(rim);

const stickers = new StickerSystem();
scene.add(stickers.object3d);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 4;
controls.maxDistance = 14;
controls.target.set(0, 0, 0);
controls.update();

mountMoveUI({
  onParse(tokens) {
    stickers.enqueue(tokens as any, 200);
  }
});

function onResize() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener("resize", onResize);

let last = performance.now();
renderer.setAnimationLoop(() => {
  const now = performance.now();
  const dt = now - last;
  last = now;

  controls.update();
  stickers.update(dt);
  renderer.render(scene, camera);
});

window.play = (sequence: string) => {
  const tokens = parseMoves(sequence);
  stickers.enqueue(tokens as any, 200);
};
