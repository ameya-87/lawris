"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Calendar, Link2, CheckCircle2, CircleX } from "lucide-react";
import { classifyUrgency, urgencyClass, daysUntil } from "@/lib/deadlines";
import { SyncButton, type SyncState } from "./sync-button";

export type CalendarDeadline = {
  id: string;
  title: string;
  due_date: string;
  deadline_type: string;
  notes: string | null;
  case_id: string;
  case_title: string;
  case_number: string | null;
};

type SyncInfo = {
  status: SyncState;
  event_link: string | null;
};

interface Props {
  items: CalendarDeadline[];
  initialConnected: boolean;
  initialSyncMap: Record<string, SyncInfo>;
}

export function CalendarView({
  items,
  initialConnected,
  initialSyncMap,
}: Props) {
  const [connected, setConnected] = useState(initialConnected);
  const [syncMap, setSyncMap] = useState<Record<string, SyncInfo>>(initialSyncMap);
  const [bulkRunning, setBulkRunning] = useState(false);

  const grouped = useMemo(() => {
    const g = {
      critical: [] as CalendarDeadline[],
      high: [] as CalendarDeadline[],
      medium: [] as CalendarDeadline[],
      low: [] as CalendarDeadline[],
    };
    for (const d of items) {
      const u = classifyUrgency(new Date(d.due_date));
      g[u].push(d);
    }
    return g;
  }, [items]);

  const totals = {
    total: items.length,
    synced: Object.values(syncMap).filter((s) => s.status === "synced").length,
  };

  function handleConnect() {
    if (!connected) {
      toast.message("Redirecting you to Google…");
      const here = typeof window !== "undefined" ? window.location.pathname : "/calendar";
      window.location.href = `/api/integrations/google/connect?return_to=${encodeURIComponent(
        here,
      )}`;
    }
  }

  // Refresh connected state once on mount (catches fresh OAuth returns).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/integrations/google/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => !cancelled && setConnected(!!d.connected))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Handle ?google=connected toast after OAuth callback.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    const s = p.get("google");
    if (s === "connected") {
      toast.success("Google Calendar connected");
      const url = new URL(window.location.href);
      url.searchParams.delete("google");
      url.searchParams.delete("message");
      window.history.replaceState({}, "", url.toString());
    } else if (s === "error") {
      toast.error(p.get("message") ?? "Google connection failed");
    }
  }, []);

  async function syncAll() {
    if (!connected) {
      handleConnect();
      return;
    }
    const targets = items.filter(
      (d) => (syncMap[d.id]?.status ?? "idle") !== "synced",
    );
    if (!targets.length) {
      toast.info("Everything is already synced");
      return;
    }
    setBulkRunning(true);
    let ok = 0;
    let fail = 0;
    for (const d of targets) {
      setSyncMap((m) => ({
        ...m,
        [d.id]: { status: "syncing", event_link: m[d.id]?.event_link ?? null },
      }));
      try {
        const res = await fetch("/api/calendar-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deadline_id: d.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message ?? "Sync failed");
        setSyncMap((m) => ({
          ...m,
          [d.id]: { status: "synced", event_link: data.html_link ?? null },
        }));
        ok++;
      } catch {
        setSyncMap((m) => ({
          ...m,
          [d.id]: { status: "failed", event_link: m[d.id]?.event_link ?? null },
        }));
        fail++;
      }
    }
    setBulkRunning(false);
    if (ok && !fail) toast.success(`Synced ${ok} event${ok === 1 ? "" : "s"}`);
    else if (ok && fail) toast.warning(`Synced ${ok}, failed ${fail}`);
    else toast.error("Sync failed");
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-sm text-stone-600 mt-0.5">
            {totals.total} open deadlines · {totals.synced} synced to Google Calendar
          </p>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-2.5 py-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Google Calendar connected
            </span>
          ) : (
            <button
              onClick={handleConnect}
              className="inline-flex items-center gap-2 text-sm font-medium text-stone-700 border border-stone-300 hover:border-indigo-300 hover:text-indigo-700 bg-white rounded-md px-3 py-1.5 transition"
            >
              <Link2 className="h-3.5 w-3.5" />
              Connect Google Calendar
            </button>
          )}
          <button
            onClick={syncAll}
            disabled={bulkRunning || totals.total === 0}
            className="inline-flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-md px-3 py-1.5 transition"
          >
            <Calendar className="h-3.5 w-3.5" />
            {bulkRunning ? "Syncing…" : "Sync all to Google"}
          </button>
        </div>
      </header>

      {(["critical", "high", "medium", "low"] as const).map((bucket) =>
        grouped[bucket].length === 0 ? null : (
          <section key={bucket}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs uppercase tracking-wide text-stone-500">
                {bucket} ({grouped[bucket].length})
              </h2>
            </div>
            <ul className="bg-white border border-stone-200 rounded-lg overflow-hidden divide-y divide-stone-100 shadow-sm">
              {grouped[bucket].map((d) => {
                const days = daysUntil(d.due_date);
                const syncInfo = syncMap[d.id] ?? { status: "idle" as SyncState, event_link: null };
                return (
                  <li
                    key={d.id}
                    className="p-4 flex items-start gap-4 hover:bg-stone-50/60 transition"
                  >
                    <div
                      className={`px-2.5 py-1 rounded text-xs font-medium border ${urgencyClass(bucket)} whitespace-nowrap`}
                    >
                      {days === 0 ? "Today" : days < 0 ? `${Math.abs(days)}d ago` : `in ${days}d`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{d.title}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Link
                          href={`/cases/${d.case_id}`}
                          className="text-xs text-indigo-700 hover:underline"
                        >
                          {d.case_title}
                        </Link>
                        <span className="text-stone-300 text-xs">·</span>
                        <span className="text-[11px] uppercase tracking-wide text-stone-500">
                          {d.deadline_type}
                        </span>
                      </div>
                      {d.notes && (
                        <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                          {d.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 whitespace-nowrap">
                      <div className="text-xs text-stone-500">{d.due_date}</div>
                      <SyncButton
                        deadlineId={d.id}
                        initial={syncInfo.status}
                        initialEventLink={syncInfo.event_link}
                        connected={connected}
                        onRequireConnect={handleConnect}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ),
      )}

      {items.length === 0 && (
        <div className="bg-white border border-dashed border-stone-300 rounded-lg p-12 text-center">
          <div className="mx-auto h-10 w-10 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center mb-3">
            <CircleX className="h-4 w-4 text-stone-400" />
          </div>
          <div className="text-sm font-medium text-stone-800">No open deadlines</div>
          <p className="text-xs text-stone-500 mt-1">
            Deadlines will appear here as they&rsquo;re added to your cases.
          </p>
        </div>
      )}
    </div>
  );
}
