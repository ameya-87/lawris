"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, X } from "lucide-react";
import { segmentText, type Segment } from "@/lib/clauses/matcher";
import type { ClauseDef, ClauseRisk } from "@/lib/clauses/dictionary";

interface Props {
  text: string | null | undefined;
  /** Inherit the surrounding text styling; default renders as inline. */
  as?: "span" | "div" | "p";
  className?: string;
}

/**
 * Renders a block of text, wrapping any recognised legal clauses with a
 * subtle hoverable pill that reveals a ClausePopover on hover (desktop) or
 * click (mobile). Non-invasive: no network calls, no RAG coupling.
 */
export function ClauseText({ text, as = "span", className }: Props) {
  const segments = useMemo(() => segmentText(text ?? ""), [text]);
  const Tag = as;
  if (!text) return null;

  return (
    <Tag className={className}>
      {segments.map((seg, i) =>
        seg.kind === "text" ? (
          <span key={i}>{seg.text}</span>
        ) : (
          <ClauseMark key={i} text={seg.text} clause={seg.clause} />
        ),
      )}
    </Tag>
  );
}

function ClauseMark({
  text,
  clause,
}: {
  text: string;
  clause: Segment extends infer S ? (S extends { clause: infer C } ? C : never) : never;
}) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false); // click-to-pin (mobile/kbd)
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!pinned) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setPinned(false);
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setPinned(false);
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [pinned]);

  const visible = open || pinned;

  return (
    <span
      ref={rootRef}
      className="relative inline"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => !pinned && setOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setPinned((v) => !v);
          setOpen(true);
        }}
        className={`inline underline decoration-dotted decoration-indigo-400 underline-offset-4 hover:decoration-solid hover:text-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 rounded px-0.5 transition-colors cursor-help ${
          pinned ? "text-indigo-800 bg-indigo-50/60" : ""
        }`}
        aria-expanded={visible}
        aria-label={`Clause: ${(clause as ClauseDef).name}`}
      >
        {text}
      </button>
      {visible && <ClausePopover clause={clause as ClauseDef} onClose={() => { setPinned(false); setOpen(false); }} />}
    </span>
  );
}

const RISK_STYLES: Record<ClauseRisk, { label: string; chip: string }> = {
  high: { label: "High risk", chip: "bg-red-50 text-red-800 border-red-200" },
  medium: { label: "Medium", chip: "bg-amber-50 text-amber-800 border-amber-200" },
  low: { label: "Low", chip: "bg-yellow-50 text-yellow-800 border-yellow-200" },
  info: { label: "Info", chip: "bg-stone-50 text-stone-700 border-stone-200" },
};

function ClausePopover({ clause, onClose }: { clause: ClauseDef; onClose: () => void }) {
  const risk = RISK_STYLES[clause.risk];
  return (
    <span
      role="tooltip"
      className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-40 w-72 max-w-[80vw] bg-white border border-stone-200 rounded-lg shadow-lg p-3.5 text-left animate-in fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="flex items-start gap-2.5">
        <span className="flex-shrink-0 mt-0.5 h-7 w-7 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
          <BookOpen className="h-3.5 w-3.5" />
        </span>
        <span className="flex-1 min-w-0 block">
          <span className="flex items-start justify-between gap-2">
            <span className="block">
              <span className="block text-sm font-semibold text-stone-900 leading-snug">
                {clause.name}
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 text-[11px]">
                <span className="text-stone-500 uppercase tracking-wide">{clause.category}</span>
                <span className="text-stone-300">·</span>
                <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 font-medium ${risk.chip}`}>
                  {risk.label}
                </span>
              </span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-0.5 rounded text-stone-300 hover:text-stone-600 hover:bg-stone-100 transition flex-shrink-0"
              aria-label="Close"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
          <span className="block mt-2 text-xs leading-relaxed text-stone-700">
            {clause.summary}
          </span>
          {clause.source && (
            <span className="block mt-2 text-[11px] text-stone-500">
              Source: <span className="text-stone-700">{clause.source}</span>
            </span>
          )}
        </span>
      </span>
    </span>
  );
}
