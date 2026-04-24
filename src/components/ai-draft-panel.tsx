"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Copy, Printer, Loader2 } from "lucide-react";
import { mdToHtml } from "@/lib/markdown";
import type { CaseType } from "@/lib/types";

const docOptions: { value: "bail_app" | "plaint"; label: string; gatedBy: CaseType[] }[] = [
  { value: "bail_app", label: "Bail Application", gatedBy: ["criminal"] },
  { value: "plaint", label: "Plaint (Civil Suit)", gatedBy: ["civil", "consumer", "labour", "family"] },
];

export function AiDraftPanel({ caseId, caseType }: { caseId: string; caseType: CaseType }) {
  const router = useRouter();
  const [streaming, setStreaming] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [docType, setDocType] = useState<"bail_app" | "plaint">(
    caseType === "criminal" ? "bail_app" : "plaint",
  );
  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setStreaming(true);
    setDraft("");
    setError(null);
    try {
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        signal: ac.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case_id: caseId, doc_type: docType }),
      });
      if (!res.ok || !res.body) {
        setError(`Stream failed (${res.status})`);
        setStreaming(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        setDraft((d) => d + decoder.decode(value, { stream: true }));
      }
      setStreaming(false);
      router.refresh();
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") setError(e.message);
      setStreaming(false);
    }
  }

  const html = draft ? mdToHtml(draft) : "";
  const available = docOptions.filter((d) => d.gatedBy.includes(caseType));

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-indigo-50 p-2">
            <Sparkles className="h-4 w-4 text-indigo-700" />
          </div>
          <div>
            <h3 className="font-medium text-sm">AI document drafter</h3>
            <p className="text-xs text-stone-500">Uses live case data + Indian court formatting rules.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as "bail_app" | "plaint")}
            className="text-sm px-3 py-2 border border-stone-300 rounded-md bg-white"
          >
            {available.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            onClick={generate}
            disabled={streaming}
            className="bg-indigo-700 text-white text-sm px-4 py-2 rounded-md hover:bg-indigo-800 disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {streaming ? "Drafting…" : "Draft"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-900 text-sm rounded p-3">{error}</div>
      )}

      {(streaming || draft) && (
        <div className="border border-stone-200 rounded-md bg-stone-50">
          <div className="flex items-center justify-between px-3 py-2 border-b border-stone-200 bg-white">
            <div className="text-xs text-stone-500">
              {streaming ? "Streaming…" : `Drafted ${draft.length} chars`}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(draft)}
                disabled={!draft}
                className="text-xs text-stone-600 hover:text-indigo-700 inline-flex items-center gap-1"
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
              <button
                onClick={() => window.print()}
                disabled={!draft}
                className="text-xs text-stone-600 hover:text-indigo-700 inline-flex items-center gap-1"
              >
                <Printer className="h-3.5 w-3.5" /> Print
              </button>
            </div>
          </div>
          <div
            className="prose-legal p-6 max-h-[36rem] overflow-auto bg-white"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      )}
    </div>
  );
}
