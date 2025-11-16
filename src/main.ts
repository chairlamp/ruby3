import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createSolvedCubeGroup } from "./view/cubeStatic";
import { mountMoveUI } from "./ui/controls";

const container = document.getElementById("app")!;
const fpsLabel = document.createElement("div");
fpsLabel.className = "fps";
fpsLabel.textContent = "FPS —";
container.appendChild(fpsLabel);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

const R: any = renderer as any;
if ("outputColorSpace" in R) {
  R.outputColorSpace = (THREE as any).SRGBColorSpace;
  if ((THREE as any).ColorManagement) (THREE as any).ColorManagement.enabled = true;
} else {
  R.outputEncoding = (THREE as any).sRGBEncoding;
  if ((THREE as any).ColorManagement) (THREE as any).ColorManagement.enabled = true;
}
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0e14);
const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(6, 4, 6);
camera.lookAt(0, 0, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.55));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
keyLight.position.set(5, 7, 8);
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
rimLight.position.set(-6, 3, -5);
scene.add(rimLight);

scene.add(createSolvedCubeGroup());

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 4.0;
controls.maxDistance = 14.0;
controls.target.set(0, 0, 0);
controls.update();

console.debug("[ui] mounting move panel…");
mountMoveUI({
  onParse(tokens, text) {
    console.debug("[ui] parsed", tokens, "from", text);
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
let frames = 0;
let acc = 0;
renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
  const now = performance.now();
  acc += now - last;
  last = now;
  frames++;
  if (acc >= 500) {
    console.debug("[fps]", Math.round((frames * 1000) / acc));
    acc = 0;
    frames = 0;
  }
});
