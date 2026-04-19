import { supabaseServer } from "@/lib/supabase/server";
import { getLawyerId } from "@/lib/auth/session";
import { CasesBrowser } from "@/components/cases/cases-browser";
import type { Case } from "@/lib/types";

export const dynamic = "force-dynamic";

type CaseRow = Case & { clients: { full_name: string } | null };

async function loadCases(): Promise<CaseRow[]> {
  const sb = supabaseServer();
  const lawyerId = await getLawyerId();
  const { data } = await sb
    .from("cases")
    .select("*, clients(full_name)")
    .eq("lawyer_id", lawyerId)
    .order("created_at", { ascending: false });
  return (data ?? []) as CaseRow[];
}

export default async function CasesPage() {
  const cases = await loadCases();
  const initialHits = cases.map((c) => ({
    case_id: c.id,
    title: c.title,
    case_number: c.case_number,
    case_type: c.case_type,
    phase: c.phase,
    status: c.status,
    court_name: c.court_name,
    client_name: c.clients?.full_name ?? null,
    snippet: c.ai_summary ?? c.notes ?? "",
    matched_fields: [],
    score: 0,
  }));

  return <CasesBrowser initialHits={initialHits} />;
}
