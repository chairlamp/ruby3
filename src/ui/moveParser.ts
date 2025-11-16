export type Face = "U" | "D" | "L" | "R" | "F" | "B";
export type MoveToken = {
  face: Face; // e.g., "R"
  power: 1 | 2; // 90° or 180°
  prime: boolean; // counterclockwise when true
};

/**
 * Normalize a single token string like "R", "R'", "R′", "R2", "R'2", "R2'" into a MoveToken.
 * Returns null on invalid token.
 */
export function parseToken(t: string): MoveToken | null {
  if (!t) return null;
  const PRIME_CH = "′"; // U+2032
  const PRIME_ASCII = "'";
  const face = t[0]?.toUpperCase();
  if (!/[UDLRFB]/.test(face)) return null;

  // Accept either order for suffixes (rare: "R'2" or "R2'").
  const rest = t.slice(1);
  let power: 1 | 2 = 1;
  let prime = false;
  for (const ch of rest) {
    if (ch === "2") power = 2;
    else if (ch === PRIME_CH || ch === PRIME_ASCII) prime = true;
    else if (!/\s/.test(ch)) return null; // unknown char
  }
  return { face: face as Face, power, prime };
}

/**
 * Parse a sequence like "F R U L D′ F B′ R U" or "R2 U' F2".
 * Tokens must be whitespace-separated.
 */
export function parseMoves(seq: string): MoveToken[] {
  const tokens: MoveToken[] = [];
  const chunks = seq.trim().split(/\s+/).filter(Boolean);
  for (const raw of chunks) {
    const t = parseToken(raw);
    if (!t) throw new Error(`Invalid move token: "${raw}"`);
    tokens.push(t);
  }
  return tokens;
}

/** Format tokens back to a normalized string using ASCII apostrophe for prime. */
export function formatMoves(tokens: MoveToken[]): string {
  return tokens
    .map((m) => m.face + (m.power === 2 ? "2" : "") + (m.prime ? "'" : ""))
    .join(" ");
}
