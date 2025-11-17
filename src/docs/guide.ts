import { createTour, type TourStep } from "./tour";

const SCRAMBLE = `F R U L D' F B' R U`;

function applyPresetScramble() {
  const input = document.querySelector<HTMLInputElement>('[data-role="moves-input"]');
  const parseBtn = document.querySelector<HTMLButtonElement>('[data-role="parse-btn"]');
  if (input) input.value = SCRAMBLE;
  parseBtn?.click();
}

function prepare4D() {
  const planeI = document.querySelector<HTMLSelectElement>('[data-tour="r4"] select:nth-of-type(1)');
  const planeJ = document.querySelector<HTMLSelectElement>('[data-tour="r4"] select:nth-of-type(2)');
  if (planeI && planeJ) {
    planeI.value = planeI.value;
    planeJ.value = planeJ.value;
  }
}

export function mountGuidedTourLauncher() {
  const button = document.createElement("button");
  button.textContent = "Start tour";
  Object.assign(button.style, {
    position: "absolute",
    right: "14px",
    top: "14px",
    zIndex: "1000",
    padding: "6px 10px",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "rgba(2,6,23,.75)",
    color: "#e6eef8",
    cursor: "pointer",
  } as CSSStyleDeclaration);
  document.body.appendChild(button);

  const steps: TourStep[] = [
    {
      id: "scramble",
      selector: '[data-tour="moves"]',
      title: "Step 1 of 3 — Sample scramble (p. 2)",
      body: "We’ll use the paper’s preset: “F R U L D′ F B′ R U”. Click Next and we’ll parse it for you, then use Play/Step to watch the permutation.",
      before: applyPresetScramble,
      placement: "n",
    },
    {
      id: "eigen",
      selector: '[data-tour="eigen"]',
      title: "Step 2 — Cycles → roots of unity",
      body: "Cycle wheel and eigen‑ring: each cycle length k contributes ticks at the k‑th roots of unity. Hover to highlight the corresponding orbit.",
      placement: "w",
    },
    {
      id: "r4",
      selector: '[data-tour="r4"]',
      title: "Step 3 — 4D toggle & plane rotations (p. 4)",
      body: "Use the two plane selectors to pick (i,j) and (k,l), then drag θ and φ to see independent rotations. The tesseract wireframe updates live.",
      before: prepare4D,
      placement: "w",
    },
  ];

  const tour = createTour(steps);
  button.onclick = () => tour.start();
  (window as any).__tour = tour;
}
