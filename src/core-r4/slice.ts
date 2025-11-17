export function slabAlpha(w: number, w0: number, half: number): number {
  const d = Math.abs(w - w0);
  const h = Math.max(1e-9, half);
  const inner = 0.5 * h;
  if (d >= h) return 0;
  if (d <= inner) return 1;
  const x = (d - inner) / (h - inner); // 0..1
  return 1 - (x * x * (3 - 2 * x)); // mirrored smoothstep
}
