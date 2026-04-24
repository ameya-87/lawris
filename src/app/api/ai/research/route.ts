import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "@/lib/gemini";
import { supabaseServer } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { RESEARCH_SYSTEM, RESEARCH_RESPONSE_SCHEMA, researchUserPrompt, type ResearchResponse } from "@/lib/prompts/research";
import { retrieveChunks, retrieveCorpusChunksHybrid } from "@/lib/rag";
import { getSourceUrl } from "@/lib/source-urls";
import { getDocumentSignedUrl } from "@/lib/storage";
import type { Case } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  case_id: z.string().min(8),
  query: z.string().min(3),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const sb = supabaseServer();
  const { data: caseRow, error: caseErr } = await sb
    .from("cases")
    .select("*")
    .eq("id", parsed.data.case_id)
    .single<Case>();
  if (caseErr || !caseRow) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const summary = caseRow.ai_summary ?? caseRow.notes ?? caseRow.title;

  const [caseChunks, corpusChunks] = await Promise.all([
    retrieveChunks(parsed.data.query, parsed.data.case_id, 3),
    retrieveCorpusChunksHybrid(parsed.data.query, 6),
  ]);

  console.log("[RAG retrieval]", {
    query: parsed.data.query.substring(0, 80),
    case_chunks: caseChunks.length,
    corpus_chunks: corpusChunks.length,
    corpus_sources: corpusChunks
      .map((c) => `${c.source_type}:${c.source_name.substring(0, 40)}`)
      .slice(0, 6),
    corpus_similarities: corpusChunks.map((c) => c.similarity.toFixed(2)).slice(0, 6),
  });

  const caseBlock = caseChunks.length
    ? `[CASE DOCUMENTS]\n${caseChunks.map((c, i) => `[DOC ${i + 1}] ${c.content}`).join("\n\n")}`
    : "";
  const corpusBlock = corpusChunks.length
    ? `[INDIAN LAW CORPUS]\n${corpusChunks
        .map((c, i) => `[LAW ${i + 1}] Source: ${c.source_name}\n${c.content}`)
        .join("\n\n")}`
    : "";
  const ragContext = [caseBlock, corpusBlock].filter(Boolean).join("\n\n---\n\n");

  const json = await generateText({
    model: env.geminiModelResearch(),
    systemInstruction: RESEARCH_SYSTEM,
    userPrompt: researchUserPrompt({
      caseSummary: summary,
      caseType: caseRow.case_type,
      query: parsed.data.query,
      ragContext,
    }),
    responseSchema: RESEARCH_RESPONSE_SCHEMA,
    temperature: 0.3,
  });

  let response: ResearchResponse;
  try {
    response = JSON.parse(json);
  } catch {
    return NextResponse.json({ error: "Model returned invalid JSON", raw: json }, { status: 502 });
  }

  response.citations = response.citations.map((c) => ({
    ...c,
    source_url:
      c.source_type === "law" && c.case_name_or_statute
        ? getSourceUrl(c.case_name_or_statute, "law")
        : null,
  }));

  const { data: caseDocuments } = await sb
    .from("documents")
    .select("id, name, storage_path")
    .eq("case_id", parsed.data.case_id);

  response.case_documents = await Promise.all(
    (caseDocuments ?? []).map(async (d) => ({
      id: d.id as string,
      name: d.name as string,
      url: await getDocumentSignedUrl((d.storage_path as string | null) ?? null),
    })),
  );

  // Persist the Q&A
  await sb.from("research_notes").insert({
    case_id: parsed.data.case_id,
    query: parsed.data.query,
    source: "ai_chat",
    content: JSON.stringify(response),
    citation:
      response.citations
        .map((c) => c.case_name_or_statute ?? c.source ?? [c.title, c.citation].filter(Boolean).join(", "))
        .filter(Boolean)
        .join("; ") || null,
    tags: [caseRow.case_type, caseRow.phase],
  });

  return NextResponse.json(response);
}
