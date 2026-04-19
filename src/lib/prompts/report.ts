/**
 * Prompts for the Case Intelligence Report generator.
 *
 * We return {systemInstruction, userPrompt} tuples so they slot directly into
 * the project's existing generateText() wrapper in src/lib/gemini.ts.
 */

export interface PromptPair {
  systemInstruction: string;
  userPrompt: string;
}

const EXEC_SUMMARY_SYSTEM =
  "You are a senior Indian advocate writing a case intelligence brief for " +
  "internal use. Write in formal legal prose. Use Indian legal terminology. " +
  "Reference the BNSS, BNS, CPC where applicable. Be precise, not verbose.";

const EXEC_SUMMARY_INSTRUCTIONS = [
  "Generate a professional Executive Case Summary for the following matter.",
  "Write exactly 4 paragraphs covering:",
  "",
  "Paragraph 1 — Background: Who are the parties, what is the nature of the " +
    "dispute/matter, which court, current phase.",
  "Paragraph 2 — Key Factual Position: The most important facts established so " +
    "far (from hearing logs and case notes). What has happened procedurally.",
  "Paragraph 3 — Legal Analysis: The strongest legal arguments currently " +
    "available. Cite specific statute sections (BNS/BNSS/CPC) and any relevant " +
    "Supreme Court precedents from the research notes if present.",
  "Paragraph 4 — Current Risk & Status: The most pressing deadlines, risks, or " +
    "procedural requirements. What could go wrong if not addressed immediately.",
  "",
  "Return only the 4 paragraphs separated by a blank line. No headers. No " +
    "bullet points. Plain prose only.",
].join("\n");

export function buildExecutiveSummaryPrompt(caseContext: string): PromptPair {
  return {
    systemInstruction: EXEC_SUMMARY_SYSTEM,
    userPrompt: `${EXEC_SUMMARY_INSTRUCTIONS}\n\nCASE DATA:\n${caseContext}`,
  };
}

const NEXT_STEPS_SYSTEM =
  "You are a legal case manager for an Indian advocate. Output only valid " +
  "JSON. No markdown. No explanation.";

const NEXT_STEPS_INSTRUCTIONS = [
  "Analyze this case and return a JSON array of the 5 most important next",
  "action items the advocate must take. Each item must have:",
  '  action: string (specific, actionable, max 15 words)',
  "  priority: 'urgent' | 'high' | 'normal'",
  "  reason: string (one sentence explaining why)",
  "  deadline_hint: string | null (e.g. 'Within 3 days' or null)",
  "",
  "Return ONLY the JSON array. No wrapper object. No markdown code fences.",
].join("\n");

/** JSON schema for the next-steps response — lets Gemini return structured JSON. */
export const NEXT_STEPS_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      action: { type: "string" },
      priority: { type: "string", enum: ["urgent", "high", "normal"] },
      reason: { type: "string" },
      deadline_hint: { type: "string", nullable: true },
    },
    required: ["action", "priority", "reason"],
  },
} as const;

export function buildNextStepsPrompt(caseContext: string): PromptPair {
  return {
    systemInstruction: NEXT_STEPS_SYSTEM,
    userPrompt: `${NEXT_STEPS_INSTRUCTIONS}\n\nCASE DATA:\n${caseContext}`,
  };
}

export interface NextStepItem {
  action: string;
  priority: "urgent" | "high" | "normal";
  reason: string;
  deadline_hint?: string | null;
}
