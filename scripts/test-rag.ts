import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
const __scriptFile = fileURLToPath(import.meta.url);
dotenv.config({ path: path.resolve(path.dirname(__scriptFile), "..", ".env.local") });

import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const query = "BNSS section 187 chargesheet deadline";
  console.log("Query:", query);

  for (const model of ["gemini-embedding-001", "gemini-embedding-004"]) {
    console.log(`\n--- Testing model: ${model} ---`);
    try {
      const resp = await ai.models.embedContent({
        model,
        contents: query,
        config: { outputDimensionality: 768 },
      });
      const embedding = resp.embeddings?.[0]?.values;
      console.log(`Embedding dimensions: ${embedding?.length}`);

      const { data, error } = await supabase.rpc("match_corpus", {
        query_embedding: JSON.stringify(embedding),
        match_count: 3,
        filter_category: null,
      });

      if (error) {
        console.log(`RPC error: ${error.message}`);
        continue;
      }

      console.log(`Chunks returned: ${data?.length ?? 0}`);
      if (data && data.length > 0) {
        console.log(`Top match similarity: ${data[0].similarity}`);
        console.log(`Top match source: ${data[0].source_name}`);
        console.log(`Top match content (first 120 chars): ${data[0].content.substring(0, 120)}`);
      }
    } catch (err) {
      const e = err as Error;
      console.log(`Model ${model} failed: ${e.message}`);
    }
  }

  console.log("\n--- Also probing without outputDimensionality (model default) ---");
  for (const model of ["gemini-embedding-001", "gemini-embedding-004"]) {
    try {
      const resp = await ai.models.embedContent({ model, contents: query });
      const dim = resp.embeddings?.[0]?.values?.length;
      console.log(`${model} default dim: ${dim}`);
    } catch (err) {
      console.log(`${model} default failed: ${(err as Error).message}`);
    }
  }
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
