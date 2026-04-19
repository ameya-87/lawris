import { supabaseServer } from "@/lib/supabase/server";

export async function getDocumentSignedUrl(storagePath: string | null): Promise<string | null> {
  if (!storagePath) return null;
  const supabase = supabaseServer();
  const { data, error } = await supabase.storage
    .from("case-documents")
    .createSignedUrl(storagePath, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}
