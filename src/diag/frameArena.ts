let inFrame = false;
let frameAllocs = 0;

export function beginFrame() {
  inFrame = true;
  frameAllocs = 0;
}

export function endFrame() {
  inFrame = false;
  if (frameAllocs > 0) {
    console.warn(`[budgets] ${frameAllocs} dynamic allocations flagged in frame`);
  }
}

/** Mark an allocation that shouldn't occur per-frame (dev-only). */
export function flagAlloc(count = 1) {
  if (inFrame) frameAllocs += count;
}

/** Wrap operations that must not allocate during the frame. */
export function noAlloc<T>(fn: () => T): T {
  const before = frameAllocs;
  const out = fn();
  const after = frameAllocs;
  if (after !== before) {
    console.warn(
      `[budgets] unexpected allocation inside noAlloc block (+${after - before})`
    );
  }
  return out;
}
