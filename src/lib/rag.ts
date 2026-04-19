import { GoogleGenAI } from "@google/genai";
import { supabaseServer } from "@/lib/supabase/server";
import type { ChunkMatch } from "@/lib/types";

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;
// `gemini-embedding-001` returns 3072-dim by default; the existing
// `document_chunks.embedding` column is `vector(768)`, so we truncate.
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMS = 768;

function chunkText(text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + CHUNK_SIZE).join(" ");
    if (chunk.trim()) chunks.push(chunk);
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

export async function embedText(text: string): Promise<number[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: { outputDimensionality: EMBEDDING_DIMS },
  });
  return response.embeddings?.[0]?.values ?? [];
}

export async function ingestDocument(
  pdfBuffer: Buffer,
  documentId: string,
  caseId: string,
): Promise<number> {
  // pdf-parse v2.x exports a PDFParse class (v1 had a default-export function).
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(pdfBuffer) });
  const { text: rawText } = await parser.getText();
  await parser.destroy();
  if (!rawText || rawText.trim().length === 0) {
    throw new Error("No text could be extracted from this PDF");
  }

  const chunks = chunkText(rawText);
  const supabase = supabaseServer();

  let inserted = 0;
  for (let i = 0; i < chunks.length; i++) {
    const embedding = await embedText(chunks[i]);
    const { error } = await supabase.from("document_chunks").insert({
      document_id: documentId,
      case_id: caseId,
      chunk_index: i,
      content: chunks[i],
      embedding: JSON.stringify(embedding),
    });
    if (!error) inserted++;
  }

  return inserted;
}

export async function retrieveChunks(
  query: string,
  caseId: string,
  topK = 5,
): Promise<ChunkMatch[]> {
  const queryEmbedding = await embedText(query);
  const supabase = supabaseServer();

  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_case_id: caseId,
    match_count: topK,
  });

  if (error) {
    console.error("Vector search error:", error);
    return [];
  }

  return (data as ChunkMatch[]) ?? [];
}

export interface CorpusMatch {
  content: string;
  source_name: string;
  section_reference: string | null;
  category: string | null;
  source_type: string;
  similarity: number;
}

export async function retrieveCorpusChunks(
  query: string,
  topK = 3,
  category?: string,
): Promise<CorpusMatch[]> {
  const queryEmbedding = await embedText(query);
  const supabase = supabaseServer();
  const { data, error } = await supabase.rpc("match_corpus", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_count: topK,
    filter_category: category ?? null,
  });
  if (error) {
    console.error("Corpus search error:", error);
    return [];
  }
  return (data as CorpusMatch[]) ?? [];
}

export async function retrieveCorpusChunksHybrid(
  query: string,
  topK = 6,
): Promise<CorpusMatch[]> {
  const supabase = supabaseServer();

  // Step 1: Extract section numbers from query (e.g. "187", "187(3)", "483", "Article 21").
  const sectionMatches = query.match(/\b(?:section\s+)?(\d{1,4}(?:\(\d+\))?)\b/gi) ?? [];
  const cleanSections = sectionMatches
    .map((s) => s.replace(/^section\s+/i, "").trim())
    .filter((s) => /^\d{1,4}/.test(s));

  // Step 2: Keyword search for section numbers in statute chunks.
  const keywordResults: CorpusMatch[] = [];
  for (const section of cleanSections.slice(0, 3)) {
    const patterns = [
      `% ${section}.%`,
      `% ${section} %`,
      `%Section ${section}%`,
    ];
    for (const pattern of patterns) {
      const { data } = await supabase.rpc("match_corpus_keyword", {
        keyword_pattern: pattern,
        match_count: 2,
      });
      if (data) keywordResults.push(...(data as CorpusMatch[]));
    }
  }

  const seen = new Set<string>();
  const uniqueKeyword = keywordResults
    .filter((r) => {
      const key = r.content.substring(0, 100);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);

  // Step 3: Stratified semantic search (top statutes + top judgments).
  const queryEmbedding = await embedText(query);
  const { data: stratifiedData, error } = await supabase.rpc("match_corpus_stratified", {
    query_embedding: JSON.stringify(queryEmbedding),
    per_type_count: 3,
  });

  if (error) {
    console.error("Stratified corpus search error:", error);
    return uniqueKeyword;
  }

  const semanticResults = (stratifiedData as CorpusMatch[]) ?? [];

  // Step 4: Merge — keyword hits on top, then semantic hits, deduped by content signature.
  const merged = [...uniqueKeyword];
  const mergedSigs = new Set(uniqueKeyword.map((r) => r.content.substring(0, 100)));
  for (const r of semanticResults) {
    const sig = r.content.substring(0, 100);
    if (!mergedSigs.has(sig)) {
      merged.push(r);
      mergedSigs.add(sig);
    }
  }

  return merged.slice(0, topK);
}
