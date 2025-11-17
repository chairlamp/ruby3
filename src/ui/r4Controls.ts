import type { Axis4 } from "../core-r4";
import type { DoublePlane } from "../render-tesseract/tesseract";

type Handlers = {
  setPlanes: (p: DoublePlane) => void;
  setAngles: (thetaRad: number, phiRad: number) => void;
};

const AXES: { id: Axis4; label: string }[] = [
  { id: 0, label: "x" },
  { id: 1, label: "y" },
  { id: 2, label: "z" },
  { id: 3, label: "w" },
];

export function mountR4Controls(host: HTMLElement, h: Handlers) {
  host.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.style.marginTop = "12px";
  wrap.innerHTML = `
    <div style="font-weight:600; margin-bottom:8px">4D Controls</div>
    <div style="display:grid; grid-template-columns:auto auto; gap:8px; align-items:center">
      <div style="opacity:.9">Plane A (i,j)</div>
      <div>
        <select id="pA_i"></select>
        <select id="pA_j"></select>
      </div>
      <div style="opacity:.9">Plane B (k,l)</div>
      <div>
        <select id="pB_k"></select>
        <select id="pB_l"></select>
      </div>
      <div style="opacity:.9">θ (deg)</div>
      <input id="theta" type="range" min="-180" max="180" value="0" step="1">
      <div style="opacity:.9">φ (deg)</div>
      <input id="phi" type="range" min="-180" max="180" value="0" step="1">
      <label style="grid-column:1 / -1; display:flex; gap:8px; align-items:center; margin-top:6px; user-select:none">
        <input id="sync" type="checkbox">
        <span>Sync φ = θ</span>
      </label>
    </div>
  `;
  host.appendChild(wrap);

  const sel = (id: string) => wrap.querySelector<HTMLSelectElement>(`#${id}`)!;
  const rng = (id: string) => wrap.querySelector<HTMLInputElement>(`#${id}`)!;

  const pA_i = sel("pA_i");
  const pA_j = sel("pA_j");
  const pB_k = sel("pB_k");
  const pB_l = sel("pB_l");
  const theta = rng("theta");
  const phi = rng("phi");
  const sync = wrap.querySelector<HTMLInputElement>("#sync")!;

  for (const s of [pA_i, pA_j, pB_k, pB_l]) {
    for (const axis of AXES) {
      const opt = document.createElement("option");
      opt.value = String(axis.id);
      opt.textContent = axis.label;
      s.appendChild(opt);
    }
  }
  pA_i.value = "0";
  pA_j.value = "1";
  pB_k.value = "2";
  pB_l.value = "3";

  function coerce(a: Axis4, b: Axis4): [Axis4, Axis4] {
    if (a === b) b = ((b + 1) % 4) as Axis4;
    return [a, b];
  }

  function currentPlanes(): DoublePlane {
    let i = Number(pA_i.value) as Axis4;
    let j = Number(pA_j.value) as Axis4;
    let k = Number(pB_k.value) as Axis4;
    let l = Number(pB_l.value) as Axis4;
    [i, j] = coerce(i, j);
    [k, l] = coerce(k, l);
    pA_i.value = String(i);
    pA_j.value = String(j);
    pB_k.value = String(k);
    pB_l.value = String(l);
    return { i, j, k, l };
  }

  const deg2rad = (deg: number) => (deg * Math.PI) / 180;

  function updateAnglesFromUI() {
    const th = Number(theta.value);
    if (sync.checked) {
      phi.value = theta.value;
    }
    const ph = Number(phi.value);
    h.setAngles(deg2rad(th), deg2rad(ph));
  }

  function updatePlanesFromUI() {
    h.setPlanes(currentPlanes());
    updateAnglesFromUI();
  }

  pA_i.addEventListener("change", updatePlanesFromUI);
  pA_j.addEventListener("change", updatePlanesFromUI);
  pB_k.addEventListener("change", updatePlanesFromUI);
  pB_l.addEventListener("change", updatePlanesFromUI);
  theta.addEventListener("input", updateAnglesFromUI);
  phi.addEventListener("input", updateAnglesFromUI);
  sync.addEventListener("change", updateAnglesFromUI);

  updatePlanesFromUI();

  return {
    setAnglesDeg(thDeg: number, phDeg: number) {
      theta.value = String(thDeg);
      phi.value = String(phDeg);
      updateAnglesFromUI();
    },
    setPlanes(p: DoublePlane) {
      pA_i.value = String(p.i);
      pA_j.value = String(p.j);
      pB_k.value = String(p.k);
      pB_l.value = String(p.l);
      updatePlanesFromUI();
    },
  };
}
