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
