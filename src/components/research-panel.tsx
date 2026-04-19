"use client";

import { useState } from "react";
import type { ResearchNote } from "@/lib/types";
import type { CaseDocumentRef, CitationItem, ResearchResponse } from "@/lib/prompts/research";
import { getSourceHost } from "@/lib/source-urls";
import { Send, Loader2, BookOpen, Sparkles, ExternalLink } from "lucide-react";

type Turn = { query: string; response: ResearchResponse | null; loading: boolean };

export function ResearchPanel({ caseId, initial }: { caseId: string; initial: ResearchNote[] }) {
  const [turns, setTurns] = useState<Turn[]>(() =>
    initial.map((n) => {
      let parsed: ResearchResponse | null = null;
      try {
        parsed = JSON.parse(n.content) as ResearchResponse;
      } catch {
        parsed = { answer: n.content, citations: [], statutes: [], follow_ups: [] };
      }
      return { query: n.query, response: parsed, loading: false };
    }),
  );
  const [draft, setDraft] = useState("");

  async function ask(q: string) {
    if (!q.trim()) return;
    setTurns((t) => [...t, { query: q, response: null, loading: true }]);
    setDraft("");
    const res = await fetch("/api/ai/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ case_id: caseId, query: q }),
    });
    if (!res.ok) {
      setTurns((t) =>
        t.map((x, i) =>
          i === t.length - 1
            ? { ...x, loading: false, response: { answer: `Error: ${res.status}`, citations: [], statutes: [], follow_ups: [] } }
            : x,
        ),
      );
      return;
    }
    const json = (await res.json()) as ResearchResponse;
    setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, loading: false, response: json } : x)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-indigo-700" />
        <h3 className="text-sm font-medium">
          Case-aware legal research
        </h3>
        <span className="text-xs text-stone-500">— answers grounded in this case&rsquo;s facts</span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(draft);
        }}
        className="bg-white border border-stone-200 rounded-lg p-3 flex items-center gap-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What are the grounds for bail in POCSO matters?"
          className="flex-1 text-sm px-3 py-2 outline-none bg-transparent"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="bg-indigo-700 text-white text-sm px-3 py-2 rounded-md hover:bg-indigo-800 disabled:opacity-40 inline-flex items-center gap-1.5"
        >
          <Send className="h-3.5 w-3.5" /> Ask
        </button>
      </form>

      {turns.length === 0 ? (
        <div className="bg-white border border-dashed border-stone-300 rounded-lg p-8 text-center text-sm text-stone-500">
          Ask anything about this case&rsquo;s law. Answers cite statutes and precedents.
        </div>
      ) : (
        <div className="space-y-4">
          {turns.map((t, i) => (
            <Turn key={i} turn={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function Turn({ turn }: { turn: Turn }) {
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-3">
      <div className="text-sm font-medium text-stone-900">Q. {turn.query}</div>
      {turn.loading && (
        <div className="flex items-center gap-2 text-sm text-stone-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Researching…
        </div>
      )}
      {turn.response && (
        <>
          <p className="text-sm leading-relaxed text-stone-800">{turn.response.answer}</p>
          {turn.response.citations.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs uppercase tracking-wide text-stone-500 flex items-center gap-1.5">
                <BookOpen className="h-3 w-3" /> Citations
              </div>
              <div>
                {turn.response.citations.map((c, i) => (
                  <CitationCard
                    key={i}
                    c={c}
                    caseDocuments={turn.response?.case_documents ?? []}
                  />
                ))}
              </div>
            </div>
          )}
          {turn.response.statutes.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs uppercase tracking-wide text-stone-500">Statutes</div>
              <ul className="space-y-1">
                {turn.response.statutes.map((s, i) => (
                  <li key={i} className="text-xs">
                    <span className="font-medium">{s.act}</span>
                    <span className="text-stone-500">, {s.section}</span>
                    <span className="text-stone-700"> — {s.relevance}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {turn.response.follow_ups.length > 0 && (
            <div className="border-t border-stone-100 pt-3 space-y-1">
              <div className="text-xs uppercase tracking-wide text-stone-500">Follow up</div>
              <div className="flex flex-wrap gap-1.5">
                {turn.response.follow_ups.map((q, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 rounded bg-stone-100 text-stone-700"
                  >
                    {q}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function resolveCitationUrl(
  c: CitationItem,
  caseDocuments: CaseDocumentRef[],
): string | null {
  if (c.source_type === "law") return c.source_url ?? null;
  if (c.source_type !== "doc") return null;
  // DOC: match citation against case_documents by fuzzy name containment.
  const haystack = `${c.source ?? ""} ${c.case_name_or_statute ?? ""}`.toLowerCase();
  for (const doc of caseDocuments) {
    if (!doc.url) continue;
    const docName = doc.name.toLowerCase();
    if (haystack.includes(docName) || (c.case_name_or_statute ?? "").toLowerCase().includes(docName)) {
      return doc.url;
    }
  }
  return null;
}

function CitationCard({
  c,
  caseDocuments,
}: {
  c: CitationItem;
  caseDocuments: CaseDocumentRef[];
}) {
  // Backwards compat: legacy responses lack core_holding — render plain one-liner.
  if (!c.core_holding) {
    const legacy = [c.title, c.citation, c.principle].filter(Boolean).join(" — ");
    const plain = c.source ?? legacy;
    if (!plain) return null;
    return <div className="text-xs text-stone-600 mb-2">{plain}</div>;
  }
  const isLaw = c.source_type === "law";
  const badgeClass = isLaw
    ? "bg-blue-100 text-blue-800"
    : "bg-amber-100 text-amber-800";
  const title = c.case_name_or_statute ?? c.source ?? "Citation";
  const url = resolveCitationUrl(c, caseDocuments);
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-4 mb-3">
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full ${badgeClass}`}
        >
          {isLaw ? "LAW" : "DOC"}
        </span>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title={`Click to open original on ${getSourceHost(url)}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            {title}
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-sm font-semibold text-stone-900">{title}</span>
        )}
      </div>
      <div className="space-y-2.5">
        <CitationField label="Core Holding" value={c.core_holding} />
        <CitationField label="Key Facts" value={c.key_facts} />
        <CitationField label="Why This Matters Here" value={c.relevance_to_query} />
      </div>
    </div>
  );
}

function CitationField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-stone-500 font-medium">
        {label}
      </div>
      <div className="text-xs text-stone-800 leading-relaxed mt-0.5">
        {value ?? "Not specified in retrieved context"}
      </div>
    </div>
  );
}
