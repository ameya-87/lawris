"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HearingLog } from "@/lib/types";
import { Plus, Loader2, Gavel } from "lucide-react";

export function HearingPanel({ caseId, initial }: { caseId: string; initial: HearingLog[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(initial.length === 0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      hearing_date: fd.get("hearing_date"),
      what_happened: fd.get("what_happened"),
      judge_order: fd.get("judge_order") || null,
      next_date: fd.get("next_date") || null,
      next_action: fd.get("next_action") || null,
    };
    const res = await fetch(`/api/cases/${caseId}/hearings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setError(`Failed (${res.status})`);
      setSubmitting(false);
      return;
    }
    setShowForm(false);
    setSubmitting(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-stone-700 uppercase tracking-wide">
          Hearing log ({initial.length})
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 text-sm text-indigo-700 hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Add hearing
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="bg-white border border-stone-200 rounded-lg p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Hearing date">
              <input
                type="date"
                name="hearing_date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
                className={input}
              />
            </Field>
            <Field label="Next hearing date">
              <input type="date" name="next_date" className={input} />
            </Field>
          </div>
          <Field label="What happened">
            <textarea
              name="what_happened"
              required
              rows={3}
              placeholder="Court granted interim bail, prosecution to file reply..."
              className={input}
            />
          </Field>
          <Field label="Judge's order / direction">
            <input name="judge_order" className={input} />
          </Field>
          <Field label="Next action required">
            <input name="next_action" placeholder="File rejoinder, prepare cross..." className={input} />
          </Field>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-900 text-sm rounded p-2">{error}</div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-stone-600 hover:text-stone-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-700 text-white text-sm px-4 py-2 rounded-md hover:bg-indigo-800 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save & regenerate summary
            </button>
          </div>
          <p className="text-xs text-stone-500">
            Saving will: (1) log the hearing, (2) auto-create a deadline if next date set, (3) regenerate the AI case summary.
          </p>
        </form>
      )}

      {initial.length === 0 ? (
        <div className="bg-white border border-dashed border-stone-300 rounded-lg p-8 text-center text-sm text-stone-500">
          No hearings logged yet.
        </div>
      ) : (
        <ol className="relative border-l border-stone-200 ml-3 space-y-5 pl-6">
          {initial.map((h) => (
            <li key={h.id} className="relative">
              <span className="absolute -left-[33px] top-1 bg-white border border-indigo-300 rounded-full p-1">
                <Gavel className="h-3 w-3 text-indigo-700" />
              </span>
              <div className="bg-white border border-stone-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <span className="font-medium text-stone-900">{h.hearing_date}</span>
                  {h.next_date && <span>· next: {h.next_date}</span>}
                </div>
                <p className="text-sm mt-1.5 leading-relaxed">{h.what_happened}</p>
                {h.judge_order && (
                  <p className="text-xs text-stone-700 mt-2">
                    <span className="uppercase tracking-wide text-stone-500">Order: </span>
                    {h.judge_order}
                  </p>
                )}
                {h.next_action && (
                  <p className="text-xs text-amber-800 mt-1">
                    <span className="uppercase tracking-wide">To do: </span>
                    {h.next_action}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const input =
  "w-full text-sm px-3 py-2 bg-white border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-stone-700 mb-1.5">{label}</div>
      {children}
    </label>
  );
}
