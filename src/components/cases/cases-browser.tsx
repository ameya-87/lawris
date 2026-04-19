"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, X, Loader2, Plus, FileText, Scale, ChevronDown } from "lucide-react";

type Hit = {
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

interface Props {
  initialHits: Hit[];
}

const CASE_TYPES = ["civil", "criminal", "family", "labour", "consumer"] as const;
const PHASES = ["intake", "pretrial", "pleadings", "charges", "evidence", "arguments", "judgment"] as const;
const STATUSES = ["active", "stayed", "disposed", "appealed"] as const;

export function CasesBrowser({ initialHits }: Props) {
  const [q, setQ] = useState("");
  const [caseType, setCaseType] = useState<string>("");
  const [phase, setPhase] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [hits, setHits] = useState<Hit[]>(initialHits);
  const [loading, setLoading] = useState(false);
  const [debouncedQ, setDebouncedQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce the query.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 180);
    return () => clearTimeout(t);
  }, [q]);

  // Fetch whenever query or filters change.
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQ) params.set("q", debouncedQ);
    if (caseType) params.set("case_type", caseType);
    if (phase) params.set("phase", phase);
    if (status) params.set("status", status);

    // Skip network on the very first render when filters + query are empty — use SSR data.
    const anyFilter = Boolean(debouncedQ || caseType || phase || status);
    if (!anyFilter && hits === initialHits) return;

    let cancelled = false;
    setLoading(true);
    fetch(`/api/cases/search?${params.toString()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setHits(data.hits ?? []);
      })
      .catch(() => {
        if (!cancelled) setHits([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, caseType, phase, status]);

  // `/` focuses the search bar.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const activeFilterCount =
    (caseType ? 1 : 0) + (phase ? 1 : 0) + (status ? 1 : 0);
  const showingSearch = debouncedQ.length > 0;

  function clearAll() {
    setQ("");
    setCaseType("");
    setPhase("");
    setStatus("");
  }

  const resultsCount = hits.length;

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            Cases
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-0.5">
            {showingSearch
              ? `${resultsCount} match${resultsCount === 1 ? "" : "es"} for "${debouncedQ}"`
              : `${resultsCount} ${resultsCount === 1 ? "matter" : "matters"}`}
          </p>
        </div>
        <Link
          href="/cases/new"
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white text-sm px-3.5 py-2 rounded-md transition shadow-soft"
        >
          <Plus className="h-4 w-4" /> New case
        </Link>
      </header>

      <div className="bg-surface border border-stone-200 dark:border-stone-800 rounded-xl shadow-soft">
        <div className="flex items-center gap-2 px-4 py-3">
          <Search className="h-4 w-4 text-stone-400 dark:text-stone-500 flex-shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search cases, parties, clauses, or keywords"
            className="flex-1 text-sm outline-none bg-transparent text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
          />
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-stone-400 dark:text-stone-500" />}
          {q && (
            <button
              onClick={() => setQ("")}
              className="p-1 text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-200 rounded"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono text-stone-400 dark:text-stone-500 border border-stone-200 dark:border-stone-700 rounded px-1.5 py-0.5">
            /
          </kbd>
        </div>

        <div className="border-t border-stone-100 dark:border-stone-800 px-4 py-2.5 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] uppercase tracking-wider text-stone-400 dark:text-stone-500 mr-1">
            Filters
          </span>
          <FilterSelect label="Type" value={caseType} onChange={setCaseType} options={[...CASE_TYPES]} />
          <FilterSelect label="Stage" value={phase} onChange={setPhase} options={[...PHASES]} />
          <FilterSelect label="Status" value={status} onChange={setStatus} options={[...STATUSES]} />
          {(activeFilterCount > 0 || q) && (
            <button
              onClick={clearAll}
              className="ml-auto text-xs text-stone-500 dark:text-stone-400 hover:text-red-700 dark:hover:text-red-400 transition"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {hits.length === 0 ? (
        <EmptyState showingSearch={showingSearch} query={debouncedQ} />
      ) : (
        <ul className="space-y-2">
          {hits.map((h) => (
            <li key={h.case_id}>
              <ResultRow hit={h} query={debouncedQ} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label
      className={`relative inline-flex items-center text-xs ${
        value ? "text-indigo-800 dark:text-indigo-300" : "text-stone-700 dark:text-stone-300"
      }`}
    >
      <span
        className={`border rounded-md px-2.5 py-1 inline-flex items-center gap-1 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500 transition ${
          value
            ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/60 dark:border-indigo-900"
            : "border-stone-200 dark:border-stone-700 bg-surface"
        }`}
      >
        <span className="uppercase tracking-wider text-[10px] text-stone-400 dark:text-stone-500">
          {label}
        </span>
        <span className="capitalize font-medium">{value || "Any"}</span>
        <ChevronDown className="h-3 w-3 text-stone-400 dark:text-stone-500" />
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
      >
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function ResultRow({ hit, query }: { hit: Hit; query: string }) {
  return (
    <Link
      href={`/cases/${hit.case_id}`}
      className="block bg-surface border border-stone-200 dark:border-stone-800 rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-soft transition group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition">
              <Highlight text={hit.title} needle={query} />
            </h3>
            {hit.case_number && (
              <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                <Highlight text={hit.case_number} needle={query} />
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <Pill>{hit.case_type}</Pill>
            <Pill>{hit.phase}</Pill>
            <StatusPill status={hit.status} />
            {hit.client_name && (
              <span className="text-xs text-stone-600 dark:text-stone-400 inline-flex items-center gap-1">
                <Scale className="h-3 w-3 text-stone-400 dark:text-stone-500" />
                <Highlight text={hit.client_name} needle={query} />
              </span>
            )}
            {hit.court_name && (
              <span className="text-xs text-stone-500 dark:text-stone-500">·</span>
            )}
            {hit.court_name && (
              <span className="text-xs text-stone-500 dark:text-stone-400">
                <Highlight text={hit.court_name} needle={query} />
              </span>
            )}
          </div>
          {hit.snippet && (
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 leading-relaxed line-clamp-2">
              <Highlight text={hit.snippet} needle={query} />
            </p>
          )}
          {hit.matched_fields.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5 flex-wrap text-[10px]">
              <FileText className="h-3 w-3 text-stone-300 dark:text-stone-600" />
              <span className="text-stone-400 dark:text-stone-500 uppercase tracking-wider">Matched in</span>
              {hit.matched_fields.map((f) => (
                <span
                  key={f}
                  className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                >
                  {FIELD_LABELS[f] ?? f}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  case_number: "Case no.",
  client: "Client",
  opposing_party: "Opposing party",
  court_name: "Court",
  sections: "Sections",
  notes: "Notes",
  ai_summary: "Summary",
  document: "Document",
  hearing: "Hearing log",
  research: "Research",
};

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 capitalize">
      {children}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "active"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-900/60"
      : status === "disposed"
        ? "bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700"
        : status === "stayed"
          ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-900/60"
          : "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-200 dark:border-indigo-900/60";
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border capitalize ${tone}`}>
      {status}
    </span>
  );
}

/** Highlight literal occurrences of `needle` inside `text`. Case-insensitive. */
function Highlight({ text, needle }: { text: string; needle: string }) {
  if (!needle || !text) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(needle.toLowerCase());
  if (idx < 0) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  const n = needle.length;
  let i = idx;
  while (i >= 0) {
    if (i > cursor) parts.push(text.slice(cursor, i));
    parts.push(
      <mark
        key={`${i}`}
        className="bg-amber-100 text-amber-900 dark:bg-amber-400/20 dark:text-amber-200 rounded px-0.5"
      >
        {text.slice(i, i + n)}
      </mark>,
    );
    cursor = i + n;
    i = text.toLowerCase().indexOf(needle.toLowerCase(), cursor);
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}

function EmptyState({ showingSearch, query }: { showingSearch: boolean; query: string }) {
  return (
    <div className="bg-surface border border-dashed border-stone-300 dark:border-stone-700 rounded-xl p-12 text-center">
      <div className="mx-auto h-10 w-10 rounded-full bg-surface-muted border border-stone-200 dark:border-stone-700 flex items-center justify-center mb-3">
        <Search className="h-4 w-4 text-stone-400 dark:text-stone-500" />
      </div>
      {showingSearch ? (
        <>
          <div className="text-sm font-medium text-stone-800 dark:text-stone-200">
            No cases match &ldquo;{query}&rdquo;
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Try a different spelling, a clause name, or remove filters.
          </p>
        </>
      ) : (
        <>
          <div className="text-sm font-medium text-stone-800 dark:text-stone-200">No cases yet</div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Create a case to start tracking deadlines, hearings, and documents.
          </p>
          <Link
            href="/cases/new"
            className="inline-flex items-center gap-1.5 mt-4 text-indigo-700 dark:text-indigo-300 hover:underline text-sm"
          >
            <Plus className="h-4 w-4" /> Create your first case
          </Link>
        </>
      )}
    </div>
  );
}
