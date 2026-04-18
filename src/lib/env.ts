function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const env = {
  geminiApiKey: () => required("GEMINI_API_KEY"),
  geminiModelDraft: () => optional("GEMINI_MODEL_DRAFT", "gemini-2.5-flash"),
  geminiModelResearch: () => optional("GEMINI_MODEL_RESEARCH", "gemini-2.5-flash-lite"),
  geminiModelSummarise: () => optional("GEMINI_MODEL_SUMMARISE", "gemini-2.5-flash-lite"),
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseServiceKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseAnonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  lawyerId: () => required("LAWYER_ID"),
};
