"use client";

import { useEffect, useState } from "react";
import { classifyUrgency, urgencyClass, daysUntil } from "@/lib/deadlines";
import type { Deadline } from "@/lib/types";
import { Check } from "lucide-react";

export function DeadlineList({ initial }: { caseId: string; initial: Deadline[] }) {
  const [items, setItems] = useState(initial);
  // `now` is intentionally null on SSR and first client render so that urgency
  // + days-until are computed identically on both (they render a neutral
  // placeholder). After mount we switch in the real value. This avoids the
  // midnight hydration mismatch where server renders "in 20d" and client
  // renders "in 19d" a few seconds later.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  async function complete(id: string) {
    setItems((x) => x.map((d) => (d.id === id ? { ...d, is_completed: true } : d)));
    await fetch(`/api/deadlines/${id}/complete`, { method: "PUT" }).catch(() => {});
  }

  if (items.length === 0) {
    return (
      <div className="bg-white border border-dashed border-stone-300 rounded-lg p-8 text-center text-sm text-stone-500">
        No deadlines tracked. Statutory deadlines auto-populate when a case has FIR data.
      </div>
    );
  }

  return (
    <ul className="bg-white border border-stone-200 rounded-lg divide-y divide-stone-100 overflow-hidden">
      {items.map((d) => {
        const u = now ? classifyUrgency(new Date(d.due_date), now) : null;
        const days = now ? daysUntil(d.due_date, now) : null;
        const pillClass = u
          ? urgencyClass(u)
          : "bg-stone-50 text-stone-500 border-stone-200";
        const label =
          days === null
            ? "—"
            : days < 0
              ? `${Math.abs(days)}d ago`
              : days === 0
                ? "Today"
                : `in ${days}d`;
        return (
          <li key={d.id} className={`p-4 flex items-start gap-4 ${d.is_completed ? "opacity-50" : ""}`}>
            <div className={`px-2.5 py-1 rounded text-xs font-medium border ${pillClass} whitespace-nowrap`}>
              {label}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm flex items-center gap-2">
                {d.title}
                {d.is_auto_generated && (
                  <span className="text-[10px] uppercase tracking-wide bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                    auto
                  </span>
                )}
              </div>
              <div className="text-xs text-stone-500 mt-0.5">
                {d.deadline_type} · due {d.due_date}
              </div>
              {d.notes && (
                <div className="text-xs text-stone-700 mt-2 leading-relaxed">{d.notes}</div>
              )}
            </div>
            {!d.is_completed && (
              <button
                onClick={() => complete(d.id)}
                className="text-stone-400 hover:text-emerald-700"
                title="Mark complete"
              >
                <Check className="h-4 w-4" />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
