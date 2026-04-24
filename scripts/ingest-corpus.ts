/**
 * Corpus ingestion — walks ~/vit_hackathon/corpus/, extracts text from each PDF
 * via pdf-parse (same pattern as src/lib/rag.ts ingestDocument), chunks,
 * embeds via Gemini, and inserts into Supabase table `corpus_chunks`.
 *
 * Run: npx tsx scripts/ingest-corpus.ts
 * Resumable: skips any source_name already ingested.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __scriptFile = fileURLToPath(import.meta.url);
dotenv.config({ path: path.resolve(path.dirname(__scriptFile), "..", ".env.local") });
import { embedText } from "@/lib/rag";
import { supabaseServer } from "@/lib/supabase/server";

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;
const EMBED_DELAY_MS = 600;

const CORPUS_DIR = path.resolve(path.dirname(__scriptFile), "..", "corpus");

type SourceType = "statute" | "judgment";

// Keyed by lowercased basename without extension.
const SOURCE_NAME_MAP: Record<string, string> = {
  "bnss_2023": "Bharatiya Nagarik Suraksha Sanhita 2023",
  "the bharatiya nyaya sanhita, 2023": "Bharatiya Nyaya Sanhita 2023",
  "the bharatiya sakshya adhiniyam, 2023": "Bharatiya Sakshya Adhiniyam 2023",
  "the code of civil procedure, 1908": "Code of Civil Procedure 1908",
  "the protection of children from sexual offences act, 2012": "POCSO Act 2012",
  "human_rights_act,_1993": "Protection of Human Rights Act 1993",
  "satender kumar antil case": "Satender Kumar Antil v. CBI (2022)",
  "arnesh_kumar_vs_state_of_bihar_anr_on_2_july_2014": "Arnesh Kumar v. State of Bihar (2014)",
  "hans_kumar_vs_the_state_govt_of_nct_of_del_on_26_september_2023": "Hans Kumar v. State of NCT Delhi (2023)",
  "maneka_gandhi_vs_union_of_india_on_25_january_1978": "Maneka Gandhi v. Union of India (1978)",
  "rahul_pathak_rahul_baveshbhai_pathak_vs_state_of_punjab_on_11_december": "Rahul Pathak v. State of Punjab",
  "rahul_pathak_rahul_bhaveshbhai_pathak_vs_state_of_punjab_on_11_december": "Rahul Pathak v. State of Punjab",
  "mrs_a_s_templeton_vs_government_of_nct_of_delhi_on_18_july_2011": "A.S. Templeton v. Govt of NCT Delhi (2011)",
  "mahender_bansal_vs_rajinder_kaur_and_ors_on_31_january_2024": "Mahender Bansal v. Rajinder Kaur (2024)",
  "need_to_complete_the_construction_of_br_09_10_road_at_masharakh": "Construction Order Matter",
  "smt_sushma_trivedi_w_o_late_hon'ble_vs_union_of_india_secretary": "Sushma Trivedi v. Union of India",
};

function titleCase(s: string): string {
  return s
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

function deriveSourceName(filePath: string): string {
  const base = path.basename(filePath).replace(/\.(pdf|PDF)$/, "");
  const key = base.toLowerCase();
  return SOURCE_NAME_MAP[key] ?? titleCase(base);
}

function deriveSourceType(filePath: string): SourceType {
  const normalized = filePath.replace(/\\/g, "/");
  if (normalized.includes("/statutes/")) return "statute";
  if (normalized.includes("/judgments/")) return "judgment";
  throw new Error(`Cannot determine source_type for ${filePath}`);
}

function deriveCategory(filePath: string, sourceType: SourceType): string | null {
  if (sourceType === "statute") return null;
  const normalized = filePath.replace(/\\/g, "/");
  const m = normalized.match(/\/judgments\/([^/]+)\//);
  return m ? m[1] : null;
}

function walkPdfs(dir: string): string[] {
  const out: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkPdfs(full));
    } else if (entry.isFile() && /\.pdf$/i.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

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

async function extractPdfText(filePath: string): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const buf = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  const { text } = await parser.getText();
  await parser.destroy();
  return text ?? "";
}

async function main() {
  const startMs = Date.now();
  const sb = supabaseServer();

  const pdfs = walkPdfs(CORPUS_DIR);
  console.log(`Discovered ${pdfs.length} PDF files under ${CORPUS_DIR}`);

  let totalInserted = 0;
  let totalEmbedCalls = 0;
  let filesProcessed = 0;
  let filesSkipped = 0;

  for (const filePath of pdfs) {
    const sourceType = deriveSourceType(filePath);
    const sourceName = deriveSourceName(filePath);
    const category = deriveCategory(filePath, sourceType);

    const existing = await sb
      .from("corpus_chunks")
      .select("id", { count: "exact", head: true })
      .eq("source_name", sourceName);
    if (existing.error) {
      console.error(`[${sourceName}] Resume check failed: ${existing.error.message}`);
      continue;
    }
    if ((existing.count ?? 0) > 0) {
      console.log(`SKIP: ${sourceName} already ingested (${existing.count} chunks)`);
      filesSkipped++;
      continue;
    }

    console.log(`[${sourceName}] Parsing ${path.basename(filePath)}...`);
    let text: string;
    try {
      text = await extractPdfText(filePath);
    } catch (e) {
      console.error(`[${sourceName}] PDF parse failed:`, (e as Error).message);
      continue;
    }
    if (!text.trim()) {
      console.warn(`[${sourceName}] No extractable text — skipping`);
      continue;
    }

    const chunks = chunkText(text);
    console.log(`[${sourceName}] ${chunks.length} chunks, type=${sourceType}, category=${category ?? "-"}`);

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await embedText(chunks[i]);
      totalEmbedCalls++;
      if (!embedding.length) {
        console.warn(`[${sourceName}] Empty embedding at chunk ${i} — skipping`);
      } else {
        const ins = await sb.from("corpus_chunks").insert({
          source_type: sourceType,
          source_name: sourceName,
          category,
          chunk_index: i,
          content: chunks[i],
          embedding: JSON.stringify(embedding),
        });
        if (ins.error) {
          console.error(`[${sourceName}] Insert failed at chunk ${i}: ${ins.error.message}`);
        } else {
          totalInserted++;
        }
      }
      if ((i + 1) % 10 === 0) {
        console.log(`[${sourceName}] Ingested ${i + 1}/${chunks.length} chunks`);
      }
      await new Promise((r) => setTimeout(r, EMBED_DELAY_MS));
    }
    console.log(`[${sourceName}] Done — ${chunks.length} chunks`);
    filesProcessed++;
  }

  const elapsedSec = Math.round((Date.now() - startMs) / 1000);
  console.log("---");
  console.log(`Summary:`);
  console.log(`  Files discovered: ${pdfs.length}`);
  console.log(`  Files processed:  ${filesProcessed}`);
  console.log(`  Files skipped:    ${filesSkipped}`);
  console.log(`  Chunks inserted:  ${totalInserted}`);
  console.log(`  Embedding calls:  ${totalEmbedCalls}`);
  console.log(`  Time elapsed:     ${elapsedSec}s`);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
