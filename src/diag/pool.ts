type Bucket<T extends ArrayBufferView> = T[];
type K = "f32" | "u32" | "u16" | "i32";

const buckets: Record<K, Map<number, Bucket<any>>> = {
  f32: new Map(),
  u32: new Map(),
  u16: new Map(),
  i32: new Map(),
};

function nextPow2(n: number): number {
  let x = 1;
  while (x < n) x <<= 1;
  return x;
}

function take<T extends ArrayBufferView>(kind: K, n: number, ctor: any): T {
  const cap = nextPow2(Math.max(1, n));
  const b = buckets[kind];
  const list = b.get(cap);
  if (!list || list.length === 0) {
    return new ctor(cap) as T;
  }
  return list.pop() as T;
}

function put<T extends ArrayBufferView>(kind: K, buf: T) {
  const b = buckets[kind];
  const cap =
    (buf as any).length ??
    buf.byteLength / ((buf as any).BYTES_PER_ELEMENT ?? 1);
  let list = b.get(cap);
  if (!list) {
    list = [];
    b.set(cap, list);
  }
  list.push(buf);
}

export function takeF32(n: number) {
  return take<Float32Array>("f32", n, Float32Array);
}
export function takeU32(n: number) {
  return take<Uint32Array>("u32", n, Uint32Array);
}
export function takeU16(n: number) {
  return take<Uint16Array>("u16", n, Uint16Array);
}
export function takeI32(n: number) {
  return take<Int32Array>("i32", n, Int32Array);
}

export function putF32(a: Float32Array) {
  put("f32", a);
}
export function putU32(a: Uint32Array) {
  put("u32", a);
}
export function putU16(a: Uint16Array) {
  put("u16", a);
}
export function putI32(a: Int32Array) {
  put("i32", a);
}

/** Borrow a scratch array for the duration of `fn`, then return to pool. */
export function withF32<T>(n: number, fn: (a: Float32Array) => T): T {
  const a = takeF32(n);
  const view = a.subarray(0, n);
  try {
    return fn(view);
  } finally {
    putF32(a);
  }
}
