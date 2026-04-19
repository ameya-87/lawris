import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { generateText } from "@/lib/gemini";
import { env } from "@/lib/env";
import { SUMMARISE_SYSTEM, summariseUserPrompt } from "@/lib/prompts/summarise";
import type { Case, HearingLog } from "@/lib/types";

export const runtime = "nodejs";

const Body = z.object({
  hearing_date: z.string(),
  what_happened: z.string().min(3),
  judge_order: z.string().optional().nullable(),
  next_date: z.string().optional().nullable(),
  next_action: z.string().optional().nullable(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const sb = supabaseServer();

  const { data: hearing, error } = await sb
    .from("hearing_logs")
    .insert({ case_id: params.id, ...parsed.data })
    .select()
    .single<HearingLog>();
  if (error || !hearing) {
    return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 });
  }

  // If next_date provided, auto-create a hearing deadline
  if (parsed.data.next_date) {
    await sb.from("deadlines").insert({
      case_id: params.id,
      title: parsed.data.next_action ?? "Next hearing",
      deadline_type: "hearing",
      due_date: parsed.data.next_date,
      is_auto_generated: true,
      notes: "Auto-created from hearing log.",
    });
  }

  // Fire-and-forget regenerate AI summary using all hearings + case context.
  // We await it so the UI sees the new summary on next refresh.
  try {
    const [{ data: caseRow }, { data: hearings }] = await Promise.all([
      sb.from("cases").select("*").eq("id", params.id).single<Case>(),
      sb.from("hearing_logs").select("*").eq("case_id", params.id).order("hearing_date"),
    ]);
    if (caseRow) {
      const summary = await generateText({
        model: env.geminiModelSummarise(),
        systemInstruction: SUMMARISE_SYSTEM,
        userPrompt: summariseUserPrompt({
          caseTitle: caseRow.title,
          caseType: caseRow.case_type,
          phase: caseRow.phase,
          court: caseRow.court_name ?? "—",
          hearings: ((hearings ?? []) as HearingLog[]).map((h) => ({
            date: h.hearing_date,
            what_happened: h.what_happened,
            judge_order: h.judge_order,
            next_date: h.next_date,
            next_action: h.next_action,
          })),
        }),
        temperature: 0.3,
      });
      await sb.from("cases").update({ ai_summary: summary }).eq("id", params.id);
    }
  } catch {
    // Non-fatal — hearing was saved.
  }

  return NextResponse.json({ hearing });
}
