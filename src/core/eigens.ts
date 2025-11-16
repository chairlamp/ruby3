export type Cycle = number[];

/** Map cycle lengths -> list of cycles */
export function bucketByLength(cycles: Cycle[]): Map<number, Cycle[]> {
  const m = new Map<number, Cycle[]>();
  for (const c of cycles) {
    const k = c.length;
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(c);
  }
  return m;
}

/** Angular positions for the k-th roots of unity (radians, 0 at +x, CCW). */
export function rootsOfUnityAngles(k: number): number[] {
  const a: number[] = [];
  for (let j = 0; j < k; j++) a.push((2 * Math.PI * j) / k);
  return a;
}

/**
 * Sum the sizes of all cycles in the buckets.
 */
export function sumBucketSizes(buckets: Map<number, Cycle[]>): number {
  let total = 0;
  for (const cycles of buckets.values()) {
    for (const c of cycles) {
      total += c.length;
    }
  }
  return total;
}
