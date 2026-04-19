"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Case, Client, Deadline, Document, HearingLog, ResearchNote } from "@/lib/types";
import { DeadlineList } from "./deadline-list";
import { AiDraftPanel } from "./ai-draft-panel";
import { HearingPanel } from "./hearing-panel";
import { ResearchPanel } from "./research-panel";
import { DocumentList } from "./document-list";
import { DocumentUpload } from "@/components/document-upload";
import { ClauseText } from "@/components/clause/clause-text";

type Props = {
  case: Case & { clients: Client | null };
  deadlines: Deadline[];
  documents: Document[];
  hearings: HearingLog[];
  research: ResearchNote[];
};

type Tab = "deadlines" | "documents" | "hearings" | "research";

export function CaseDetail({ case: c, deadlines, documents, hearings, research }: Props) {
  const [tab, setTab] = useState<Tab>("deadlines");
  const router = useRouter();

  return (
    <div className="space-y-6">
      <header className="bg-white border border-stone-200 rounded-lg p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs">
          <Pill>{c.case_type}</Pill>
          <Pill>{c.phase}</Pill>
          <Pill>{c.status}</Pill>
          {c.case_number && <span className="text-stone-500 font-mono">{c.case_number}</span>}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{c.title}</h1>
        <div className="text-sm text-stone-600 grid grid-cols-2 md:grid-cols-4 gap-y-1.5 gap-x-6">
          {c.court_name && <Field label="Court" value={c.court_name} />}
          {c.clients && <Field label="Client" value={c.clients.full_name} />}
          {c.fir_number && <Field label="FIR" value={`${c.fir_number} (${c.fir_date ?? "—"})`} />}
          {c.sections && <Field label="Sections" value={c.sections} />}
        </div>
        {c.ai_summary ? (
          <div className="bg-indigo-50 border border-indigo-100 rounded p-3 text-sm leading-relaxed text-indigo-950">
            <div className="text-xs uppercase tracking-wide text-indigo-700 font-medium mb-1">AI summary</div>
            <ClauseText as="div" text={c.ai_summary} />
          </div>
        ) : (
          <div className="text-xs text-stone-400 italic">
            AI summary will appear after the first hearing log is added.
          </div>
        )}
      </header>

      <div className="border-b border-stone-200 flex gap-1">
        {(["deadlines", "documents", "hearings", "research"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize transition ${
              tab === t
                ? "border-indigo-700 text-indigo-700"
                : "border-transparent text-stone-500 hover:text-stone-900"
            }`}
          >
            {t}
            <CountBadge n={count(t, deadlines, documents, hearings, research)} />
          </button>
        ))}
      </div>

      <div>
        {tab === "deadlines" && <DeadlineList caseId={c.id} initial={deadlines} />}
        {tab === "documents" && (
          <div className="space-y-6">
            <div className="mb-6 p-4 border border-dashed border-indigo-200 rounded-lg bg-indigo-50/30">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">📎 Upload case document for AI analysis</h3>
              <DocumentUpload caseId={c.id} onSuccess={() => router.refresh()} />
              <p className="text-xs text-gray-500 mt-2">Uploaded PDFs are indexed for AI-grounded legal research.</p>
            </div>
            <AiDraftPanel caseId={c.id} caseType={c.case_type} />
            <DocumentList initial={documents} />
          </div>
        )}
        {tab === "hearings" && (
          <HearingPanel caseId={c.id} initial={hearings} />
        )}
        {tab === "research" && (
          <ResearchPanel caseId={c.id} initial={research} />
        )}
      </div>
    </div>
  );
}

function count(t: Tab, d: Deadline[], doc: Document[], h: HearingLog[], r: ResearchNote[]): number {
  switch (t) {
    case "deadlines": return d.filter((x) => !x.is_completed).length;
    case "documents": return doc.length;
    case "hearings": return h.length;
    case "research": return r.length;
  }
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 capitalize">{children}</span>;
}

function CountBadge({ n }: { n: number }) {
  if (!n) return null;
  return <span className="ml-1.5 text-xs px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded-full tabular-nums">{n}</span>;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs uppercase tracking-wide text-stone-500 mr-1.5">{label}:</span>
      <span>{value}</span>
    </div>
  );
}
