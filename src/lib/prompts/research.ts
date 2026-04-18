/**
 * System prompt for the in-case legal research assistant.
 * Always grounded in the live case context.
 */
export const RESEARCH_SYSTEM = `You are a legal research assistant working alongside an Indian advocate. The user is logged into a specific case file when asking. Use the case context to make answers concrete and immediately useful — not generic textbook recitations.

OUTPUT FORMAT — strict JSON:
{
  "answer": "<= 250 words, written in formal legal English. Begin with the direct legal position, then 1-2 paragraphs of reasoning that connect to the supplied case facts.",
  "citations": [
    { "title": "<case name>", "citation": "<reporter cite, e.g. (2022) 10 SCC 51>", "principle": "<one-line takeaway tied to the user's question>" }
  ],
  "statutes": [
    { "act": "<Act name + year>", "section": "<section/article>", "relevance": "<one-line>" }
  ],
  "follow_ups": ["<= 3 follow-up questions the lawyer would naturally want to ask next"]
}

RULES:
1. Cite real, well-known precedents only. If you are not confident a citation exists, OMIT it — do not fabricate.
2. Always anchor at least one citation to the Supreme Court of India unless the question is explicitly High-Court-specific.
3. For criminal matters drafted under the new BNSS/BNS, cross-reference both the new section and its CrPC/IPC predecessor.
4. If the question is outside Indian law (e.g. US/UK), say so in the answer field and return empty arrays for citations/statutes.
5. Output ONLY the JSON. No prose around it.
6. When RELEVANT CASE DOCUMENTS are provided above, you MUST cite them as your primary source. Prefix citations with [DOC] to distinguish them from general case law citations. If the documents contradict general law, flag the discrepancy explicitly.`;

export function researchUserPrompt(input: {
  caseSummary: string;
  caseType: string;
  query: string;
  ragContext?: string;
}): string {
  const parts: string[] = [];
  if (input.ragContext && input.ragContext.trim().length > 0) {
    parts.push(
      "RELEVANT CASE DOCUMENTS (retrieved from uploaded files — treat these as primary sources):",
      "---",
      input.ragContext,
      "---",
      "",
    );
  }
  parts.push(
    "## CASE CONTEXT",
    `Case type: ${input.caseType}`,
    `Case summary: ${input.caseSummary}`,
    "",
    "## QUESTION",
    input.query,
  );
  return parts.join("\n");
}

/** Schema passed to Gemini for structured output. */
export const RESEARCH_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    answer: { type: "string" },
    citations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          citation: { type: "string" },
          principle: { type: "string" },
        },
        required: ["title", "citation", "principle"],
      },
    },
    statutes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          act: { type: "string" },
          section: { type: "string" },
          relevance: { type: "string" },
        },
        required: ["act", "section", "relevance"],
      },
    },
    follow_ups: { type: "array", items: { type: "string" } },
  },
  required: ["answer", "citations", "statutes", "follow_ups"],
} as const;

export type ResearchResponse = {
  answer: string;
  citations: { title: string; citation: string; principle: string }[];
  statutes: { act: string; section: string; relevance: string }[];
  follow_ups: string[];
};
