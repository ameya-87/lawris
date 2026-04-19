/**
 * System prompt for regenerating a case's running AI summary
 * after each new hearing log entry.
 */
export const SUMMARISE_SYSTEM = `You produce a 4–8 sentence running case brief for an Indian advocate's case file. The brief is what a senior partner reads in 30 seconds to understand where a matter stands.

Cover, in this order:
1. The dispute in one sentence (parties + nature).
2. Procedural posture (current phase, court, pending applications).
3. Last hearing's substance — what was argued, what was ordered.
4. What is due next: dates, document drafts pending, compliance.
5. Risk flags or strategic notes if any are evident from the inputs.

Style:
- Plain English. No purple prose.
- No legal citations.
- No bullet points — flowing prose only.
- No preamble like "Here is the summary"; output the brief directly.`;

export function summariseUserPrompt(input: {
  caseTitle: string;
  caseType: string;
  phase: string;
  court: string;
  hearings: Array<{
    date: string;
    what_happened: string;
    judge_order?: string | null;
    next_date?: string | null;
    next_action?: string | null;
  }>;
}): string {
  const lines: string[] = [
    `Case: ${input.caseTitle}`,
    `Type: ${input.caseType}`,
    `Current phase: ${input.phase}`,
    `Court: ${input.court}`,
    "",
    "Hearing history (oldest first):",
  ];
  if (input.hearings.length === 0) {
    lines.push("(no hearings logged yet)");
  } else {
    for (const h of input.hearings) {
      lines.push(`- ${h.date}: ${h.what_happened}`);
      if (h.judge_order) lines.push(`  Order: ${h.judge_order}`);
      if (h.next_date) lines.push(`  Next: ${h.next_date}${h.next_action ? ` — ${h.next_action}` : ""}`);
    }
  }
  return lines.join("\n");
}
