"use client";

import { useState } from "react";
import type { ResearchNote } from "@/lib/types";
import type { ResearchResponse } from "@/lib/prompts/research";
import { Send, Loader2, BookOpen, Sparkles } from "lucide-react";

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
                <BookOpen className="h-3 w-3" /> Cited cases
              </div>
              <ul className="space-y-1">
                {turn.response.citations.map((c, i) => (
                  <li key={i} className="text-xs">
                    <span className="font-medium italic">{c.title}</span>
                    <span className="text-stone-500"> — {c.citation}</span>
                    <div className="text-stone-700 mt-0.5">{c.principle}</div>
                  </li>
                ))}
              </ul>
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
