"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Calendar, Check, Loader2, AlertCircle, RefreshCw } from "lucide-react";

export type SyncState = "idle" | "syncing" | "synced" | "failed";

interface Props {
  deadlineId: string;
  initial?: SyncState;
  initialEventLink?: string | null;
  connected: boolean;
  onRequireConnect: () => void;
  size?: "sm" | "md";
}

export function SyncButton({
  deadlineId,
  initial = "idle",
  initialEventLink = null,
  connected,
  onRequireConnect,
  size = "sm",
}: Props) {
  const [state, setState] = useState<SyncState>(initial);
  const [eventLink, setEventLink] = useState<string | null>(initialEventLink);

  async function doSync() {
    if (!connected) {
      onRequireConnect();
      return;
    }
    setState("syncing");
    try {
      const res = await fetch("/api/calendar-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deadline_id: deadlineId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Sync failed");
      setState("synced");
      setEventLink(data.html_link ?? null);
      toast.success("Synced to Google Calendar");
    } catch (e) {
      setState("failed");
      toast.error(e instanceof Error ? e.message : "Sync failed");
    }
  }

  const base =
    size === "sm"
      ? "text-xs px-2.5 py-1 gap-1.5"
      : "text-sm px-3 py-1.5 gap-2";

  if (state === "synced") {
    return (
      <div className="inline-flex items-center gap-1.5">
        <span
          className={`inline-flex items-center rounded-md border font-medium ${base} border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-200`}
        >
          <Check className="h-3 w-3" /> Synced
        </span>
        {eventLink && (
          <a
            href={eventLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-stone-500 dark:text-stone-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline underline-offset-2"
          >
            View
          </a>
        )}
      </div>
    );
  }

  if (state === "syncing") {
    return (
      <span
        className={`inline-flex items-center rounded-md border font-medium ${base} border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900/60 dark:bg-indigo-950/60 dark:text-indigo-200`}
      >
        <Loader2 className="h-3 w-3 animate-spin" /> Syncing…
      </span>
    );
  }

  if (state === "failed") {
    return (
      <button
        onClick={doSync}
        className={`inline-flex items-center rounded-md border font-medium ${base} border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-200 dark:hover:bg-red-950 transition`}
        title="Retry sync"
      >
        <AlertCircle className="h-3 w-3" /> Retry
        <RefreshCw className="h-3 w-3" />
      </button>
    );
  }

  return (
    <button
      onClick={doSync}
      className={`inline-flex items-center rounded-md border font-medium ${base} border-stone-300 bg-surface text-stone-700 hover:border-indigo-300 hover:text-indigo-700 dark:border-stone-700 dark:text-stone-200 dark:hover:border-indigo-500 dark:hover:text-indigo-300 transition`}
      title={connected ? "Sync to Google Calendar" : "Connect Google Calendar"}
    >
      <Calendar className="h-3 w-3" />
      Sync
    </button>
  );
}
