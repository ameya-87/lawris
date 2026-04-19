import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { getLawyerId } from "@/lib/auth/session";
import { autoDeadlinesForCase } from "@/lib/deadlines";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sb = supabaseServer();
  const lawyerId = await getLawyerId();
  const { data, error } = await sb
    .from("cases")
    .select("*, clients(full_name)")
    .eq("lawyer_id", lawyerId)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cases: data });
}

const CreateBody = z.object({
  title: z.string().min(3),
  case_type: z.enum(["civil", "criminal", "family", "labour", "consumer"]),
  client_id: z.string().min(8).optional().nullable(),
  case_number: z.string().optional().nullable(),
  court_name: z.string().optional().nullable(),
  court_type: z
    .enum(["district", "sessions", "high_court", "supreme_court", "tribunal", "magistrate"])
    .optional()
    .nullable(),
  fir_date: z.string().optional().nullable(),
  fir_number: z.string().optional().nullable(),
  police_station: z.string().optional().nullable(),
  sections: z.string().optional().nullable(),
  offence_max_years: z.coerce.number().int().min(0).max(100).optional().nullable(),
  arrest_date: z.string().optional().nullable(),
  opposing_party: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const parsed = CreateBody.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const sb = supabaseServer();
  const lawyerId = await getLawyerId();

  const { data: created, error } = await sb
    .from("cases")
    .insert({ ...parsed.data, lawyer_id: lawyerId })
    .select()
    .single();
  if (error || !created) {
    return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 });
  }

  const auto = autoDeadlinesForCase({
    caseType: parsed.data.case_type,
    firDate: parsed.data.fir_date ? new Date(parsed.data.fir_date) : null,
    offenceMaxYears: parsed.data.offence_max_years ?? null,
  });
  if (auto.length) {
    await sb.from("deadlines").insert(
      auto.map((d) => ({
        case_id: created.id,
        title: d.title,
        deadline_type: d.deadline_type,
        due_date: d.due_date,
        is_auto_generated: true,
        notes: d.notes,
      })),
    );
  }

  return NextResponse.json({ case: created, auto_deadlines: auto.length });
}
