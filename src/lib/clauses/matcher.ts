import { CLAUSE_DICTIONARY, type ClauseDef } from "./dictionary";

export type Segment =
  | { kind: "text"; text: string }
  | { kind: "clause"; text: string; clause: ClauseDef };

interface RawMatch {
  start: number;
  end: number;
  clause: ClauseDef;
}

/**
 * Segment a block of text into literal `text` runs and `clause` runs so callers
 * can wrap the clause runs with a hover popover.
 *
 * Rules:
 *   - Longest match wins when patterns overlap.
 *   - Case-insensitive; preserves original casing in the emitted segment text.
 *   - Does not allocate if no clauses match (returns a single text segment).
 */
export function segmentText(text: string): Segment[] {
  if (!text) return [{ kind: "text", text: text ?? "" }];

  const matches: RawMatch[] = [];
  for (const clause of CLAUSE_DICTIONARY) {
    for (const pattern of clause.patterns) {
      const rx = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
      let m: RegExpExecArray | null;
      while ((m = rx.exec(text)) !== null) {
        matches.push({ start: m.index, end: m.index + m[0].length, clause });
        // Guard against zero-width regex infinite loops.
        if (m.index === rx.lastIndex) rx.lastIndex++;
      }
    }
  }

  if (!matches.length) return [{ kind: "text", text }];

  // Resolve overlaps: prefer longer matches; among equal lengths, prefer earlier.
  matches.sort((a, b) => (b.end - b.start) - (a.end - a.start) || a.start - b.start);
  const accepted: RawMatch[] = [];
  for (const m of matches) {
    const conflict = accepted.some((a) => m.start < a.end && m.end > a.start);
    if (!conflict) accepted.push(m);
  }
  accepted.sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let cursor = 0;
  for (const m of accepted) {
    if (m.start > cursor) {
      segments.push({ kind: "text", text: text.slice(cursor, m.start) });
    }
    segments.push({
      kind: "clause",
      text: text.slice(m.start, m.end),
      clause: m.clause,
    });
    cursor = m.end;
  }
  if (cursor < text.length) {
    segments.push({ kind: "text", text: text.slice(cursor) });
  }
  return segments;
}
