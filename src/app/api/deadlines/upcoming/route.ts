import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getLawyerId } from "@/lib/auth/session";
import { addDays } from "date-fns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sb = supabaseServer();
  const today = new Date().toISOString().slice(0, 10);
  const horizon = addDays(new Date(), 60).toISOString().slice(0, 10);

  // Pull deadlines for cases owned by this lawyer
  const lawyerId = await getLawyerId();
  const { data: caseIdsData } = await sb
    .from("cases")
    .select("id")
    .eq("lawyer_id", lawyerId);
  const caseIds = (caseIdsData ?? []).map((r) => r.id);
  if (!caseIds.length) return NextResponse.json({ deadlines: [] });

  const { data, error } = await sb
    .from("deadlines")
    .select("*, cases(title, case_number, case_type)")
    .in("case_id", caseIds)
    .eq("is_completed", false)
    .gte("due_date", today)
    .lte("due_date", horizon)
    .order("due_date");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deadlines: data });
}
