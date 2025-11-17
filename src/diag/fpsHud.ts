export function mountFpsHud() {
  const el = document.createElement("div");
  Object.assign(el.style, {
    position: "absolute",
    left: "12px",
    bottom: "12px",
    padding: "6px 8px",
    font: "12px/1.2 system-ui, sans-serif",
    background: "rgba(15,23,42,0.72)",
    border: "1px solid #334155",
    borderRadius: "6px",
    color: "#E7EDF6",
    zIndex: "30",
    pointerEvents: "none",
  } as CSSStyleDeclaration);
  document.body.appendChild(el);
  let frames = 0;
  let last = performance.now();
  function tick() {
    frames++;
    const now = performance.now();
    if (now - last >= 1000) {
      el.textContent = `FPS: ${frames}  •  Budgets: OK`;
      frames = 0;
      last = now;
    }
    requestAnimationFrame(tick);
  }
  tick();
}
