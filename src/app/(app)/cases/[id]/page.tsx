import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { getLawyerId } from "@/lib/auth/session";
import { CaseDetail } from "@/components/case-detail";
import type { Case, Client, Deadline, Document, HearingLog, ResearchNote } from "@/lib/types";

export const dynamic = "force-dynamic";

type CaseWithClient = Case & { clients: Client | null };

async function loadCase(id: string) {
  const sb = supabaseServer();
  const lawyerId = await getLawyerId();
  const [caseRes, deadlinesRes, docsRes, hearingsRes, researchRes] = await Promise.all([
    sb.from("cases").select("*, clients(*)").eq("id", id).eq("lawyer_id", lawyerId).single(),
    sb.from("deadlines").select("*").eq("case_id", id).order("due_date"),
    sb.from("documents").select("*").eq("case_id", id).order("uploaded_at", { ascending: false }),
    sb.from("hearing_logs").select("*").eq("case_id", id).order("hearing_date", { ascending: false }),
    sb.from("research_notes").select("*").eq("case_id", id).order("created_at", { ascending: false }),
  ]);
  if (caseRes.error || !caseRes.data) return null;
  return {
    case: caseRes.data as CaseWithClient,
    deadlines: (deadlinesRes.data ?? []) as Deadline[],
    documents: (docsRes.data ?? []) as Document[],
    hearings: (hearingsRes.data ?? []) as HearingLog[],
    research: (researchRes.data ?? []) as ResearchNote[],
  };
}

export default async function CaseDetailPage({ params }: { params: { id: string } }) {
  const data = await loadCase(params.id);
  if (!data) notFound();
  return <CaseDetail {...data} />;
}
