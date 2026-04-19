import { NextResponse } from "next/server";
import { format } from "date-fns";
import { supabaseServer } from "@/lib/supabase/server";
import { getLawyerId } from "@/lib/auth/session";
import { generateText } from "@/lib/gemini";
import { env } from "@/lib/env";
import {
  buildExecutiveSummaryPrompt,
  buildNextStepsPrompt,
  NEXT_STEPS_SCHEMA,
  type NextStepItem,
} from "@/lib/prompts/report";
import { generateCaseReportDocx, type ReportData } from "@/lib/report-generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/cases/[id]/report
 *
 * Compiles a case's Supabase data + two Gemini-generated sections (executive
 * summary + next steps) into a polished DOCX and returns it as a download.
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const caseId = params.id;

  try {
    const sb = supabaseServer();
    const lawyerId = await getLawyerId();

    const [caseRes, lawyerRes, deadlinesRes, hearingsRes, documentsRes, researchRes] =
      await Promise.all([
        sb
          .from("cases")
          .select("*, clients(full_name, phone, address)")
          .eq("id", caseId)
          .eq("lawyer_id", lawyerId)
          .maybeSingle(),
        sb
          .from("users")
          .select("full_name, bar_council_no")
          .eq("id", lawyerId)
          .maybeSingle(),
        sb
          .from("deadlines")
          .select("*")
          .eq("case_id", caseId)
          .order("due_date", { ascending: true }),
        sb
          .from("hearing_logs")
          .select("*")
          .eq("case_id", caseId)
          .order("hearing_date", { ascending: false }),
        sb
          .from("documents")
          .select("name, doc_type, source, uploaded_at")
          .eq("case_id", caseId)
          .order("uploaded_at", { ascending: false }),
        sb
          .from("research_notes")
          .select("query, content, citation, source, created_at")
          .eq("case_id", caseId)
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

    if (caseRes.error || !caseRes.data) {
      return NextResponse.json(
        { error: "Case not found" },
        { status: 404 },
      );
    }

    const caseRow = caseRes.data as {
      id: string;
      title: string;
      case_number: string | null;
      case_type: string;
      phase: string;
      status: string;
      court_name: string | null;
      court_type: string | null;
      fir_date: string | null;
      fir_number: string | null;
      offence_max_years: number | null;
      opposing_party: string | null;
      notes: string | null;
      ai_summary: string | null;
      created_at: string;
      clients: { full_name: string; phone: string | null; address: string | null } | null;
    };

    const lawyerRow = lawyerRes.data as { full_name: string; bar_council_no: string | null } | null;
    const deadlines = (deadlinesRes.data ?? []) as ReportData["deadlines"];
    const hearings = (hearingsRes.data ?? []) as ReportData["hearings"];
    const documents = (documentsRes.data ?? []) as ReportData["documents"];
    const researchNotes = (researchRes.data ?? []) as ReportData["researchNotes"];

    /* ─── Build structured context for Gemini ──────────────── */

    const isCriminal = caseRow.case_type === "criminal";
    const firLine = isCriminal && caseRow.fir_number
      ? `FIR: ${caseRow.fir_number}${caseRow.fir_date ? ` dated ${caseRow.fir_date}` : ""}${
          caseRow.offence_max_years != null ? `, offence max ${caseRow.offence_max_years} years` : ""
        }`
      : null;

    const caseContext = [
      `CASE: ${caseRow.title}`,
      `TYPE: ${caseRow.case_type} | PHASE: ${caseRow.phase} | STATUS: ${caseRow.status}`,
      `CLIENT: ${caseRow.clients?.full_name ?? "Not on record"}`,
      `COURT: ${caseRow.court_name ?? "Not specified"}`,
      `OPPOSING PARTY: ${caseRow.opposing_party ?? "Not specified"}`,
      firLine,
      `CASE NOTES: ${caseRow.notes ?? "None"}`,
      `AI BRIEF: ${caseRow.ai_summary ?? "Not yet generated"}`,
      "",
      `HEARING HISTORY (${hearings.length} hearings):`,
      hearings
        .slice(0, 5)
        .map(
          (h) =>
            `[${h.hearing_date}] ${h.what_happened}. Order: ${h.judge_order ?? "None"}. Next: ${
              h.next_action ?? "None"
            }`,
        )
        .join("\n") || "No hearings logged",
      "",
      "UPCOMING DEADLINES:",
      deadlines
        .filter((d) => !d.is_completed)
        .map((d) => `${d.title} — Due ${d.due_date} [${d.urgency?.toUpperCase() ?? "—"}]`)
        .join("\n") || "No pending deadlines",
      "",
      "RESEARCH CITATIONS:",
      researchNotes
        .slice(0, 4)
        .map(
          (r) =>
            `Q: ${r.query}\nA: ${(r.content ?? "").slice(0, 300)}\nCite: ${r.citation ?? "None"}`,
        )
        .join("\n\n") || "No research notes",
    ]
      .filter((x): x is string => typeof x === "string" && x.length > 0)
      .join("\n");

    /* ─── Gemini calls ─────────────────────────────────────── */

    const execPrompt = buildExecutiveSummaryPrompt(caseContext);
    const nextPrompt = buildNextStepsPrompt(caseContext);

    let executiveSummary = "";
    let nextSteps: NextStepItem[] = [];

    const [summaryResult, stepsResult] = await Promise.allSettled([
      generateText({
        model: env.geminiModelDraft(),
        systemInstruction: execPrompt.systemInstruction,
        userPrompt: execPrompt.userPrompt,
        temperature: 0.4,
      }),
      generateText({
        model: env.geminiModelResearch(),
        systemInstruction: nextPrompt.systemInstruction,
        userPrompt: nextPrompt.userPrompt,
        temperature: 0.2,
        responseSchema: NEXT_STEPS_SCHEMA,
      }),
    ]);

    if (summaryResult.status === "fulfilled") {
      executiveSummary = summaryResult.value.trim();
    } else {
      console.warn("[report] executive summary failed:", summaryResult.reason);
      executiveSummary =
        "Executive summary could not be generated at this time. The report continues with factual case data below.";
    }

    if (stepsResult.status === "fulfilled") {
      try {
        const cleaned = stepsResult.value.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          nextSteps = parsed.slice(0, 5) as NextStepItem[];
        }
      } catch (e) {
        console.warn("[report] next steps JSON parse failed:", e);
      }
    } else {
      console.warn("[report] next steps call failed:", stepsResult.reason);
    }

    /* ─── Build report ─────────────────────────────────────── */

    const reportData: ReportData = {
      lawyer: {
        full_name: lawyerRow?.full_name ?? "Advocate",
        bar_council_no: lawyerRow?.bar_council_no ?? null,
      },
      client: {
        full_name: caseRow.clients?.full_name ?? "Not on record",
        phone: caseRow.clients?.phone ?? null,
        address: caseRow.clients?.address ?? null,
      },
      caseData: {
        title: caseRow.title,
        case_number: caseRow.case_number,
        case_type: caseRow.case_type,
        phase: caseRow.phase,
        status: caseRow.status,
        court_name: caseRow.court_name,
        court_type: caseRow.court_type,
        fir_date: caseRow.fir_date,
        fir_number: caseRow.fir_number,
        offence_max_years: caseRow.offence_max_years,
        opposing_party: caseRow.opposing_party,
        notes: caseRow.notes,
        ai_summary: caseRow.ai_summary,
        created_at: caseRow.created_at,
      },
      deadlines,
      hearings,
      documents,
      researchNotes,
      executiveSummary,
      nextSteps,
      generatedAt: new Date().toISOString(),
    };

    const buffer = await generateCaseReportDocx(reportData);

    const safeTitle = caseRow.title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
    const filename = `Lawris_Report_${safeTitle}_${format(new Date(), "yyyyMMdd")}.docx`;

    // Buffer is a Node Buffer; Next.js accepts it as a BodyInit for NextResponse.
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "report generation failed";
    console.error("[api/cases/:id/report] FATAL", message, e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
