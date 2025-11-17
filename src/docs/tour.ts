export type TourStep = {
  id: string;
  selector: string;
  title: string;
  body: string;
  before?: () => void;
  after?: () => void;
  placement?: "n" | "s" | "e" | "w" | "auto";
};

export type Tour = {
  start: () => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
  isActive: () => boolean;
};

function q(sel: string): HTMLElement | null {
  return document.querySelector(sel) as HTMLElement | null;
}

export function createTour(steps: TourStep[], onEnd?: () => void): Tour {
  const mask = document.createElement("div");
  mask.className = "tour-mask";
  const hole = document.createElement("div");
  hole.className = "tour-hole";
  const card = document.createElement("div");
  card.className = "tour-card";

  const titleEl = document.createElement("div");
  titleEl.className = "tour-title";
  const bodyEl = document.createElement("div");
  bodyEl.className = "tour-body";
  const ctrl = document.createElement("div");
  ctrl.className = "tour-ctrl";
  const btnPrev = document.createElement("button");
  btnPrev.textContent = "Back";
  const btnNext = document.createElement("button");
  btnNext.textContent = "Next";
  const btnSkip = document.createElement("button");
  btnSkip.textContent = "Skip";

  ctrl.append(btnPrev, btnNext, btnSkip);
  card.append(titleEl, bodyEl, ctrl);
  mask.append(hole, card);

  let idx = 0;
  let active = false;
  let currentTarget: HTMLElement | null = null;

  function placeCard(rect: DOMRect, placement: TourStep["placement"]) {
    const pad = 12;
    const cardRect = card.getBoundingClientRect();
    let top = rect.bottom + pad;
    let left = rect.left;
    if (placement === "n") {
      top = rect.top - cardRect.height - pad;
    } else if (placement === "s") {
      top = rect.bottom + pad;
    } else if (placement === "e") {
      top = rect.top;
      left = rect.right + pad;
    } else if (placement === "w") {
      top = rect.top;
      left = rect.left - cardRect.width - pad;
    } else {
      top = Math.min(rect.bottom + pad, window.innerHeight - cardRect.height - pad);
      left = Math.min(Math.max(pad, rect.left), window.innerWidth - cardRect.width - pad);
    }
    card.style.top = `${Math.max(8, top + window.scrollY)}px`;
    card.style.left = `${Math.max(8, left + window.scrollX)}px`;
  }

  function updateFor(target: HTMLElement, step: TourStep) {
    currentTarget = target;
    const rect = target.getBoundingClientRect();
    const pad = 8;

    hole.style.left = `${rect.left + window.scrollX - pad}px`;
    hole.style.top = `${rect.top + window.scrollY - pad}px`;
    hole.style.width = `${rect.width + pad * 2}px`;
    hole.style.height = `${rect.height + pad * 2}px`;

    titleEl.textContent = step.title;
    bodyEl.textContent = step.body;
    placeCard(rect, step.placement ?? "auto");
  }

  function show(i: number) {
    if (i < 0 || i >= steps.length) return;
    if (steps[idx]?.after) steps[idx].after!();
    idx = i;

    const target = q(steps[idx].selector);
    if (!target) {
      console.warn("[tour] missing target:", steps[idx].selector);
      return;
    }
    target.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });

    if (steps[idx].before) steps[idx].before!();
    requestAnimationFrame(() => updateFor(target, steps[idx]));
  }

  function onResize() {
    if (!active || !currentTarget) return;
    updateFor(currentTarget, steps[idx]);
  }

  function start() {
    if (active) return;
    active = true;
    document.body.appendChild(mask);
    document.addEventListener("scroll", onResize, true);
    window.addEventListener("resize", onResize);
    show(0);
  }

  function stop() {
    if (!active) return;
    if (steps[idx]?.after) steps[idx].after!();
    active = false;
    document.removeEventListener("scroll", onResize, true);
    window.removeEventListener("resize", onResize);
    mask.remove();
    onEnd?.();
  }

  btnNext.onclick = () => (idx + 1 < steps.length ? show(idx + 1) : stop());
  btnPrev.onclick = () => show(Math.max(0, idx - 1));
  btnSkip.onclick = stop;

  document.addEventListener("keydown", (e) => {
    if (!active) return;
    if (e.key === "Escape") stop();
    if (e.key === "ArrowRight" || e.key === "Enter") btnNext.click();
    if (e.key === "ArrowLeft") btnPrev.click();
  });

  return {
    start,
    stop,
    next: () => show(idx + 1),
    prev: () => show(idx - 1),
    isActive: () => active,
  };
}
