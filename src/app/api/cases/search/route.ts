import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getLawyerId } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cases/search?q=...&case_type=...&phase=...&status=...
 *
 * Ranks cases by keyword matches across:
 *   - case fields (title, case_number, court_name, sections, opposing_party, notes, ai_summary)
 *   - client name
 *   - document names attached to the case
 *   - hearing log entries (what_happened, judge_order, next_action)
 *   - research notes (query, content)
 *
 * No full-text index required — uses ILIKE per field + an in-memory weighted
 * score. Fast enough at hackathon scale, no new infra.
 */
type SearchHit = {
  case_id: string;
  title: string;
  case_number: string | null;
  case_type: string;
  phase: string;
  status: string;
  court_name: string | null;
  client_name: string | null;
  snippet: string;
  matched_fields: string[];
  score: number;
};

const FIELD_WEIGHTS: Record<string, number> = {
  title: 10,
  case_number: 9,
  client: 8,
  opposing_party: 7,
  court_name: 6,
  sections: 6,
  notes: 4,
  ai_summary: 4,
  document: 5,
  hearing: 3,
  research: 3,
};

function escLike(s: string): string {
  return s.replace(/[%_\\]/g, "\\$&");
}

function snippetAround(text: string | null | undefined, needle: string, window = 120): string {
  if (!text) return "";
  const idx = text.toLowerCase().indexOf(needle.toLowerCase());
  if (idx < 0) return text.slice(0, window) + (text.length > window ? "…" : "");
  const start = Math.max(0, idx - Math.floor(window / 2));
  const end = Math.min(text.length, idx + needle.length + Math.floor(window / 2));
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return prefix + text.slice(start, end) + suffix;
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const caseType = req.nextUrl.searchParams.get("case_type");
  const phase = req.nextUrl.searchParams.get("phase");
  const status = req.nextUrl.searchParams.get("status");

  const lawyerId = await getLawyerId();
  const sb = supabaseServer();

  // Baseline: fetch the lawyer's cases, honouring filters. Used even when q is empty.
  let baseQuery = sb
    .from("cases")
    .select("id, title, case_number, case_type, phase, status, court_name, sections, opposing_party, notes, ai_summary, clients(full_name)")
    .eq("lawyer_id", lawyerId);
  if (caseType) baseQuery = baseQuery.eq("case_type", caseType);
  if (phase) baseQuery = baseQuery.eq("phase", phase);
  if (status) baseQuery = baseQuery.eq("status", status);

  const { data: baseRows, error: baseErr } = await baseQuery.order("created_at", { ascending: false });
  if (baseErr) return NextResponse.json({ error: baseErr.message }, { status: 500 });
  const rows = (baseRows ?? []) as unknown as Array<{
    id: string;
    title: string;
    case_number: string | null;
    case_type: string;
    phase: string;
    status: string;
    court_name: string | null;
    sections: string | null;
    opposing_party: string | null;
    notes: string | null;
    ai_summary: string | null;
    clients: { full_name: string } | null;
  }>;

  // If the user hasn't typed a query, return filtered list as-is.
  if (!q) {
    const hits: SearchHit[] = rows.map((r) => ({
      case_id: r.id,
      title: r.title,
      case_number: r.case_number,
      case_type: r.case_type,
      phase: r.phase,
      status: r.status,
      court_name: r.court_name,
      client_name: r.clients?.full_name ?? null,
      snippet: r.ai_summary ?? r.notes ?? "",
      matched_fields: [],
      score: 0,
    }));
    return NextResponse.json({ hits, total: hits.length, query: "" });
  }

  const needle = q.toLowerCase();
  const pattern = `%${escLike(q)}%`;
  const caseIds = rows.map((r) => r.id);
  const byId = new Map(rows.map((r) => [r.id, r]));

  // Satellite hits: documents, hearings, research_notes. Restricted to cases
  // the lawyer owns (we scope via caseIds).
  const [docsRes, hearingsRes, researchRes] = await Promise.all([
    caseIds.length
      ? sb
          .from("documents")
          .select("case_id, name, doc_type")
          .in("case_id", caseIds)
          .ilike("name", pattern)
      : Promise.resolve({ data: [], error: null } as const),
    caseIds.length
      ? sb
          .from("hearing_logs")
          .select("case_id, what_happened, judge_order, next_action")
          .in("case_id", caseIds)
          .or(`what_happened.ilike.${pattern},judge_order.ilike.${pattern},next_action.ilike.${pattern}`)
      : Promise.resolve({ data: [], error: null } as const),
    caseIds.length
      ? sb
          .from("research_notes")
          .select("case_id, query, content")
          .in("case_id", caseIds)
          .or(`query.ilike.${pattern},content.ilike.${pattern}`)
      : Promise.resolve({ data: [], error: null } as const),
  ]);

  const scoreMap = new Map<
    string,
    { score: number; fields: Set<string>; snippet: string | null }
  >();
  const bump = (caseId: string, field: string, weight: number, snippet?: string | null) => {
    const prev = scoreMap.get(caseId) ?? { score: 0, fields: new Set<string>(), snippet: null as string | null };
    prev.score += weight;
    prev.fields.add(field);
    if (!prev.snippet && snippet) prev.snippet = snippet;
    scoreMap.set(caseId, prev);
  };

  // Case-row scoring.
  for (const r of rows) {
    if (r.title?.toLowerCase().includes(needle)) bump(r.id, "title", FIELD_WEIGHTS.title, r.title);
    if (r.case_number?.toLowerCase().includes(needle)) bump(r.id, "case_number", FIELD_WEIGHTS.case_number, r.case_number);
    if (r.clients?.full_name?.toLowerCase().includes(needle)) bump(r.id, "client", FIELD_WEIGHTS.client, r.clients.full_name);
    if (r.opposing_party?.toLowerCase().includes(needle)) bump(r.id, "opposing_party", FIELD_WEIGHTS.opposing_party, r.opposing_party);
    if (r.court_name?.toLowerCase().includes(needle)) bump(r.id, "court_name", FIELD_WEIGHTS.court_name, r.court_name);
    if (r.sections?.toLowerCase().includes(needle)) bump(r.id, "sections", FIELD_WEIGHTS.sections, r.sections);
    if (r.notes?.toLowerCase().includes(needle)) bump(r.id, "notes", FIELD_WEIGHTS.notes, snippetAround(r.notes, q));
    if (r.ai_summary?.toLowerCase().includes(needle)) bump(r.id, "ai_summary", FIELD_WEIGHTS.ai_summary, snippetAround(r.ai_summary, q));
  }

  for (const d of (docsRes.data ?? []) as Array<{ case_id: string; name: string }>) {
    bump(d.case_id, "document", FIELD_WEIGHTS.document, `Document: ${d.name}`);
  }
  for (const h of (hearingsRes.data ?? []) as Array<{
    case_id: string;
    what_happened: string | null;
    judge_order: string | null;
    next_action: string | null;
  }>) {
    const blob = [h.what_happened, h.judge_order, h.next_action].filter(Boolean).join(" ");
    bump(h.case_id, "hearing", FIELD_WEIGHTS.hearing, snippetAround(blob, q));
  }
  for (const rn of (researchRes.data ?? []) as Array<{
    case_id: string;
    query: string;
    content: string;
  }>) {
    const blob = `${rn.query}\n${rn.content}`;
    bump(rn.case_id, "research", FIELD_WEIGHTS.research, snippetAround(blob, q));
  }

  const hits: SearchHit[] = [];
  scoreMap.forEach((agg, caseId) => {
    const r = byId.get(caseId);
    if (!r) return;
    hits.push({
      case_id: caseId,
      title: r.title,
      case_number: r.case_number,
      case_type: r.case_type,
      phase: r.phase,
      status: r.status,
      court_name: r.court_name,
      client_name: r.clients?.full_name ?? null,
      snippet: agg.snippet ?? r.ai_summary ?? "",
      matched_fields: Array.from(agg.fields),
      score: agg.score,
    });
  });
  hits.sort((a, b) => b.score - a.score);

  return NextResponse.json({ hits, total: hits.length, query: q });
}
