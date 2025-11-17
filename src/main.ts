import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { mountMoveUI } from "./ui/controls";
import { StickerSystem } from "./render/stickers";
import { parseMoves } from "./ui/moveParser";
import { mountCycleList } from "./overlays/cycles/cycleList";
import { mountPermGrid } from "./overlays/perm/permGrid";
import { mountCycleWheel } from "./overlays/cycles/cycleWheel";
import { mountEigenRing } from "./overlays/cycles/eigenRing";
import { QualityManager, type QualityTier } from "./diag/quality";
import { A11yManager } from "./a11y/a11y";
import { createTesseract } from "./render-tesseract/tesseract";
import { mountR4Controls } from "./ui/r4Controls";
import { beginFrame, endFrame } from "./diag/frameArena";
import { mountFpsHud } from "./diag/fpsHud";
import { mountGuidedTourLauncher } from "./docs/guide";
import { mountExportsPanel } from "./docs/exportsPanel";
import { configureRenderer } from "./render/rendererConfig";
import "./ui/anchors.css";
import "./ui/hud.css";
import "./ui/a11y.css";
import "./docs/tour.css";
import "./docs/exportsPanel.css";

const container = document.getElementById("app")!;

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance",
  preserveDrawingBuffer: true,
});
configureRenderer(renderer);
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
const tesseract = createTesseract({ i: 0, j: 1, k: 2, l: 3 }, renderer);
scene.add(tesseract.object3d);

let uiRight = document.getElementById("ui-right") as HTMLDivElement | null;
if (!uiRight) {
  uiRight = document.createElement("div");
  uiRight.id = "ui-right";
  Object.assign(uiRight.style, {
    position: "absolute",
    top: "12px",
    right: "12px",
    width: "360px",
    maxHeight: "80vh",
    overflow: "auto",
    background: "rgba(15,23,42,0.72)",
    backdropFilter: "blur(6px)",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "10px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
    zIndex: "20",
  } as CSSStyleDeclaration);
  document.body.appendChild(uiRight);
}
const uiRoot = uiRight!;

const listDiv = document.createElement("div");
uiRoot.appendChild(listDiv);

const onHover = (indices: number[]) => stickers.setHoverHighlights(indices);
const list = mountCycleList(listDiv, () => stickers.getPerm48(), { onHover, label: "face" });

stickers.onStateChanged = () => {
  list.refresh();
};

// -- Mount Cycle Wheel (bottom-left floating panel) --
let wheelPanel = document.getElementById("cycle-wheel-fixed") as HTMLDivElement | null;
if (!wheelPanel) {
  wheelPanel = document.createElement("div");
  wheelPanel.id = "cycle-wheel-fixed";
  wheelPanel.setAttribute("data-tour", "cycles");
  Object.assign(wheelPanel.style, {
    background: "rgba(15,23,42,0.82)",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "10px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    backdropFilter: "blur(6px)",
  } as CSSStyleDeclaration);
  document.body.appendChild(wheelPanel);
} else {
  wheelPanel.innerHTML = "";
}
const wheelHost = document.createElement("div");
wheelPanel.appendChild(wheelHost);

const wheel = mountCycleWheel(wheelHost, () => stickers.getPerm48(), {
  onHover: (indices) => {
    if (indices && indices.length) stickers.setHoverHighlights(indices);
    else stickers.setHoverHighlights([]);
  },
});

{
  const prev = stickers.onStateChanged;
  stickers.onStateChanged = () => {
    prev?.();
    wheel.refresh();
  };
}

const eigenDiv = document.createElement("div");
eigenDiv.setAttribute("data-tour", "eigen");
uiRight.appendChild(eigenDiv);

const eigen = mountEigenRing(eigenDiv, () => stickers.getPerm48(), {
  onHover: (indices) => stickers.setHoverHighlights(indices),
  size: 180,
});

{
  const prev = stickers.onStateChanged;
  stickers.onStateChanged = () => {
    prev?.();
    eigen.refresh();
  };
}

const r4Div = document.createElement("div");
r4Div.style.marginTop = "12px";
r4Div.setAttribute("data-tour", "r4");
uiRoot.appendChild(r4Div);

mountR4Controls(r4Div, {
  setPlanes: (p) => tesseract.setPlanes(p),
  setAngles: (theta, phi) => tesseract.setAngles(theta, phi),
});

if ("setSlice" in tesseract) {
  const slicePanel = document.createElement("div");
  slicePanel.style.marginTop = "8px";
  slicePanel.innerHTML = `
    <div style="margin-top:6px;font-weight:600">Slice (w = w₀)</div>
    <label style="display:flex;gap:8px;align-items:center;margin-top:6px;">
      <input id="slice-enable" type="checkbox"> Enable
    </label>
    <label style="display:flex;gap:8px;align-items:center;margin-top:6px;">
      w₀ <input id="slice-w0" type="range" min="-1.2" max="1.2" step="0.01" value="0">
      <span id="slice-w0-v" style="width:44px;text-align:right;">0.00</span>
    </label>
    <label style="display:flex;gap:8px;align-items:center;margin-top:6px;">
      thickness <input id="slice-half" type="range" min="0.02" max="0.60" step="0.01" value="0.18">
      <span id="slice-half-v" style="width:44px;text-align:right;">0.18</span>
    </label>
  `;
  uiRight.appendChild(slicePanel);

  const elOn = slicePanel.querySelector("#slice-enable") as HTMLInputElement;
  const elW0 = slicePanel.querySelector("#slice-w0") as HTMLInputElement;
  const elHalf = slicePanel.querySelector("#slice-half") as HTMLInputElement;
  const elW0v = slicePanel.querySelector("#slice-w0-v") as HTMLSpanElement;
  const elHv = slicePanel.querySelector("#slice-half-v") as HTMLSpanElement;
  const sliceFn = (tesseract as any).setSlice as (w0: number, half: number, on: boolean) => void;

  function pushSlice() {
    elW0v.textContent = (+elW0.value).toFixed(2);
    elHv.textContent = (+elHalf.value).toFixed(2);
    sliceFn(+elW0.value, +elHalf.value, elOn.checked);
  }
  elOn.oninput = elW0.oninput = elHalf.oninput = pushSlice;
  pushSlice();
}

let qualityBadge = document.getElementById("quality-badge") as HTMLDivElement | null;
if (!qualityBadge) {
  qualityBadge = document.createElement("div");
  qualityBadge.id = "quality-badge";
  Object.assign(qualityBadge.style, {
    position: "absolute",
    left: "12px",
    bottom: "12px",
    padding: "6px 8px",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontSize: "12px",
    color: "#e2e8f0",
    background: "rgba(15,23,42,0.72)",
    backdropFilter: "blur(6px)",
    border: "1px solid #334155",
    borderRadius: "6px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
    zIndex: "30",
    pointerEvents: "none",
    whiteSpace: "nowrap",
  } as CSSStyleDeclaration);
  document.body.appendChild(qualityBadge);
}

let a11yBadge = document.getElementById("a11y-badge") as HTMLDivElement | null;
if (!a11yBadge) {
  a11yBadge = document.createElement("div");
  a11yBadge.id = "a11y-badge";
  document.body.appendChild(a11yBadge);
}

declare global {
  interface Window {
    setQuality?: (tier: QualityTier | null) => void;
  }
}

const qm = new QualityManager({
  hooks: {
    setPixelRatio: (ratio) => renderer.setPixelRatio(ratio),
    setTrailLength: (n) => (stickers as any)?.setTrailLength?.(n),
    setBloomEnabled: (on) => (renderer as any)?.setBloomEnabled?.(on),
    setShadowsEnabled: (on) => {
      renderer.shadowMap.enabled = !!on;
      key.castShadow = !!on;
      rim.castShadow = !!on;
    },
    setBadge: (text) => {
      if (qualityBadge) qualityBadge.textContent = text;
    },
  },
  honorReducedMotion: true,
});
qm.attach();

window.setQuality = (tier) => qm.force(tier);

let currentTurnMs = 200;

const a11y = new A11yManager({
  hooks: {
    setCanvasFilter: (filter) => {
      renderer.domElement.style.filter = filter;
    },
    setTrailLength: (n) => (stickers as any)?.setTrailLength?.(n),
    setTurnDurationMs: (ms) => {
      currentTurnMs = ms;
    },
    setUiClass: (cls, on) => {
      document.documentElement.classList.toggle(cls, on);
    },
    setBadge: (text) => {
      if (a11yBadge) a11yBadge.textContent = text;
    },
  },
  normalTurnMs: 200,
  reducedTurnMs: 350,
});

// -- NEW: left-top dock just for the permutation grid --
const uiLeft = document.createElement("div");
uiLeft.style.position = "absolute";
uiLeft.style.top = "12px";
uiLeft.style.left = "12px";
uiLeft.style.width = "340px";
uiLeft.style.maxHeight = "80vh";
uiLeft.style.overflow = "auto";
uiLeft.style.background = "rgba(15, 23, 42, 0.72)";
uiLeft.style.backdropFilter = "blur(6px)";
uiLeft.style.border = "1px solid #334155";
uiLeft.style.borderRadius = "8px";
uiLeft.style.padding = "10px";
uiLeft.style.boxShadow = "0 8px 24px rgba(0,0,0,0.35)";
uiLeft.style.zIndex = "20";
document.body.appendChild(uiLeft);

const gridDiv = document.createElement("div");
uiLeft.appendChild(gridDiv);

const onGridHover = (i: number) => {
  if (i >= 0) stickers.setHoverHighlights([i]);
  else stickers.setHoverHighlights([]);
};

const grid = mountPermGrid(gridDiv, () => stickers.getPerm48(), { onHover: onGridHover });

const prevOnStateChanged = stickers.onStateChanged;
stickers.onStateChanged = () => {
  prevOnStateChanged?.();
  grid.refresh();
};

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 4;
controls.maxDistance = 14;
controls.target.set(0, 0, 0);
controls.update();

mountMoveUI({
  onParse(tokens) {
    stickers.enqueue(tokens as any, currentTurnMs);
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
  beginFrame();
  const now = performance.now();
  const dt = now - last;
  last = now;

  qm.tick(dt);
  controls.update();
  stickers.update(dt);
  renderer.render(scene, camera);
  endFrame();
});

(window as any).play = (sequence: string) => {
  const tokens = parseMoves(sequence);
  stickers.enqueue(tokens as any, currentTurnMs);
};
mountFpsHud();
mountGuidedTourLauncher();

const exportsPanel = mountExportsPanel({
  threeCanvas: renderer.domElement as HTMLCanvasElement,
  gridCanvas: document.querySelector<HTMLCanvasElement>("#perm-grid canvas"),
  eigenCanvas: eigenDiv.querySelector<HTMLCanvasElement>("canvas"),
});
document.body.appendChild(exportsPanel.el);
