import { GoogleGenAI } from "@google/genai";
import { env } from "./env";

let client: GoogleGenAI | null = null;

export function gemini(): GoogleGenAI {
  if (!client) client = new GoogleGenAI({ apiKey: env.geminiApiKey() });
  return client;
}

export type DraftStreamChunk = { type: "text"; text: string } | { type: "done" };

export async function* streamDraft(opts: {
  model?: string;
  systemInstruction: string;
  userPrompt: string;
}): AsyncGenerator<DraftStreamChunk> {
  const model = opts.model ?? env.geminiModelDraft();
  const stream = await gemini().models.generateContentStream({
    model,
    contents: opts.userPrompt,
    config: { systemInstruction: opts.systemInstruction, temperature: 0.4 },
  });
  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) yield { type: "text", text };
  }
  yield { type: "done" };
}

export async function generateText(opts: {
  model?: string;
  systemInstruction: string;
  userPrompt: string;
  temperature?: number;
  responseSchema?: unknown;
}): Promise<string> {
  const model = opts.model ?? env.geminiModelResearch();
  const config: Record<string, unknown> = {
    systemInstruction: opts.systemInstruction,
    temperature: opts.temperature ?? 0.4,
  };
  if (opts.responseSchema) {
    config.responseMimeType = "application/json";
    config.responseSchema = opts.responseSchema;
  }
  const result = await gemini().models.generateContent({
    model,
    contents: opts.userPrompt,
    config,
  });
  return result.text ?? "";
}
