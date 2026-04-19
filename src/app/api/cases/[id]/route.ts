import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getLawyerId } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const sb = supabaseServer();
  const lawyerId = await getLawyerId();

  const [caseRes, deadlinesRes, docsRes, hearingsRes, researchRes] = await Promise.all([
    sb.from("cases")
      .select("*, clients(*)")
      .eq("id", params.id)
      .eq("lawyer_id", lawyerId)
      .single(),
    sb.from("deadlines").select("*").eq("case_id", params.id).order("due_date"),
    sb.from("documents").select("*").eq("case_id", params.id).order("uploaded_at", { ascending: false }),
    sb.from("hearing_logs").select("*").eq("case_id", params.id).order("hearing_date", { ascending: false }),
    sb.from("research_notes").select("*").eq("case_id", params.id).order("created_at", { ascending: false }),
  ]);

  if (caseRes.error || !caseRes.data) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  return NextResponse.json({
    case: caseRes.data,
    deadlines: deadlinesRes.data ?? [],
    documents: docsRes.data ?? [],
    hearings: hearingsRes.data ?? [],
    research: researchRes.data ?? [],
  });
}
