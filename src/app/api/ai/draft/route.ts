import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { streamDraft } from "@/lib/gemini";
import { supabaseServer } from "@/lib/supabase/server";
import { getLawyerId } from "@/lib/auth/session";
import { BAIL_APPLICATION_SYSTEM, bailApplicationUserPrompt } from "@/lib/prompts/bail-application";
import { PLAINT_SYSTEM, plaintUserPrompt } from "@/lib/prompts/plaint";
import type { Case, Client, User } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  case_id: z.string().min(8),
  doc_type: z.enum(["bail_app", "plaint"]),
  extra: z
    .object({
      brief_facts: z.string().optional(),
      custom_grounds: z.string().optional(),
      relief_type: z.string().optional(),
      primary_relief: z.string().optional(),
      suit_value: z.number().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const { case_id, doc_type, extra } = parsed.data;

  const sb = supabaseServer();
  const { data: caseRow, error: caseErr } = await sb
    .from("cases")
    .select("*")
    .eq("id", case_id)
    .single<Case>();
  if (caseErr || !caseRow) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const lawyerId = await getLawyerId();
  const { data: lawyer } = await sb
    .from("users")
    .select("*")
    .eq("id", lawyerId)
    .single<User>();
  const client = caseRow.client_id
    ? (await sb.from("clients").select("*").eq("id", caseRow.client_id).single<Client>()).data
    : null;

  let systemInstruction: string;
  let userPrompt: string;
  let docName: string;

  if (doc_type === "bail_app") {
    systemInstruction = BAIL_APPLICATION_SYSTEM;
    userPrompt = bailApplicationUserPrompt({
      caseTitle: caseRow.title,
      accusedName: client?.full_name ?? caseRow.opposing_party ?? "[accused name]",
      firNumber: caseRow.fir_number,
      firDate: caseRow.fir_date,
      policeStation: caseRow.police_station,
      sections: caseRow.sections,
      arrestDate: caseRow.arrest_date,
      investigationStatus: "ongoing",
      briefFacts: extra?.brief_facts ?? caseRow.notes,
      customGrounds: extra?.custom_grounds,
      address: client?.address,
      court: caseRow.court_name ?? "[court]",
      state: "Maharashtra",
      lawyerName: lawyer?.full_name ?? "Counsel",
      barCouncilNo: lawyer?.bar_council_no,
      place: "Pune",
    });
    docName = `Bail Application — ${new Date().toISOString().slice(0, 10)}`;
  } else {
    systemInstruction = PLAINT_SYSTEM;
    userPrompt = plaintUserPrompt({
      caseTitle: caseRow.title,
      plaintiffName: client?.full_name ?? "[plaintiff]",
      plaintiffAddress: client?.address,
      defendantName: caseRow.opposing_party ?? "[defendant]",
      defendantAddress: null,
      reliefType: extra?.relief_type ?? "RECOVERY OF MONEY",
      factualBackground: caseRow.notes,
      causeOfActionDate: null,
      jurisdictionBasis: null,
      suitValue: extra?.suit_value ?? null,
      primaryRelief:
        extra?.primary_relief ??
        "Pass a decree directing the defendant to pay the suit amount along with interest at 12% p.a. from the date of cause of action till realisation",
      court: caseRow.court_name ?? "[court]",
      lawyerName: lawyer?.full_name ?? "Counsel",
      barCouncilNo: lawyer?.bar_council_no,
      place: "Pune",
    });
    docName = `Plaint — ${new Date().toISOString().slice(0, 10)}`;
  }

  let collected = "";
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamDraft({ systemInstruction, userPrompt })) {
          if (chunk.type === "text") {
            collected += chunk.text;
            controller.enqueue(encoder.encode(chunk.text));
          }
        }
        // Persist completed draft
        await sb.from("documents").insert({
          case_id,
          name: docName,
          doc_type,
          phase: caseRow.phase,
          source: "ai_drafted",
          content: collected,
          ai_prompt_used: userPrompt.slice(0, 4000),
        });
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "stream failed";
        controller.enqueue(encoder.encode(`\n\n[ERROR: ${message}]`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Doc-Type": doc_type,
    },
  });
}
