/**
 * System prompt for the in-case legal research assistant.
 * Always grounded in the live case context.
 */
export const RESEARCH_SYSTEM = `You are a legal research assistant working alongside an Indian advocate. The user is logged into a specific case file when asking. Use the case context to make answers concrete and immediately useful — not generic textbook recitations.

OUTPUT FORMAT — strict JSON:
{
  "answer": "<= 250 words, written in formal legal English. Begin with the direct legal position, then 1-2 paragraphs of reasoning that connect to the supplied case facts.",
  "citations": [
    {
      "source": "<exact tag, e.g. [LAW: Satender Kumar Antil v. CBI (2022)] or [DOC: FIR 0289/2026]>",
      "case_name_or_statute": "<clean human-readable name, e.g. Satender Kumar Antil v. CBI (2022)>",
      "source_type": "<law | doc>",
      "core_holding": "<1-2 sentences on the legal principle or section meaning>",
      "key_facts": "<1-2 sentences on the facts that triggered the holding (for cases) or the statute's applicability context (for laws)>",
      "relevance_to_query": "<1-2 sentences explaining why this was retrieved for the user's specific question>"
    }
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
6. When RELEVANT CASE DOCUMENTS are provided above, you MUST cite them as your primary source. Prefix citations with [DOC] to distinguish them from general case law citations. If the documents contradict general law, flag the discrepancy explicitly.

CITATION RULES:
When citing facts specific to this case, prefix with [DOC] — these come from uploaded case files in the [CASE DOCUMENTS] block
When citing statutes or precedents, prefix with [LAW: <source name>] — these come from the [INDIAN LAW CORPUS] block
NEVER cite a statute, section, or case name that is NOT present in either context block above
If the user asks a legal question and no relevant [INDIAN LAW CORPUS] context is available, respond: 'I cannot verify this from the available legal corpus. This answer may be based on general model knowledge and should be independently verified.'
If [DOC] facts and [LAW] provisions contradict each other, flag the discrepancy explicitly

For every item in the citations array, you MUST populate all five fields: source, case_name_or_statute, source_type, core_holding, key_facts, and relevance_to_query. Keep each field to 1-2 sentences maximum. If a field cannot be populated from the retrieved context, write 'Not specified in retrieved context' rather than inventing content.`;

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
          source: { type: "string" },
          case_name_or_statute: { type: "string" },
          source_type: { type: "string", enum: ["law", "doc"] },
          core_holding: { type: "string" },
          key_facts: { type: "string" },
          relevance_to_query: { type: "string" },
        },
        required: [
          "source",
          "case_name_or_statute",
          "source_type",
          "core_holding",
          "key_facts",
          "relevance_to_query",
        ],
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

export type CitationItem = {
  source?: string;
  case_name_or_statute?: string;
  source_type?: "law" | "doc";
  core_holding?: string;
  key_facts?: string;
  relevance_to_query?: string;
  // Enriched server-side after Gemini returns; never produced by the model.
  source_url?: string | null;
  // Legacy fields — may still appear on persisted responses written before the schema upgrade.
  title?: string;
  citation?: string;
  principle?: string;
};

export type CaseDocumentRef = {
  id: string;
  name: string;
  url: string | null;
};

export type ResearchResponse = {
  answer: string;
  citations: CitationItem[];
  statutes: { act: string; section: string; relevance: string }[];
  follow_ups: string[];
  case_documents?: CaseDocumentRef[];
};
