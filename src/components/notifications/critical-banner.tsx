"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Clock3,
  FileWarning,
  FileQuestion,
  ArrowRight,
  CheckCircle2,
  X,
} from "lucide-react";
import type { ClientNotification, NotificationIcon } from "@/lib/notifications/engine";
import { summarizeForToast, countBySeverity } from "@/lib/notifications/engine";

interface Props {
  items: ClientNotification[];
  /** Unique key for the session-toast guard — bump if you want toasts to re-fire. */
  sessionKey?: string;
}

const SESSION_TOAST_KEY = "lawris-toast-shown";

export function CriticalBanner({ items, sessionKey = "v1" }: Props) {
  const counts = countBySeverity(items);
  const hasAny = counts.critical + counts.urgent + counts.warning > 0;
  const critical = items.filter((n) => n.type === "critical");
  const [dismissed, setDismissed] = useState(false);

  // Fire summary toasts once per browser session, on dashboard mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const alreadyShown = sessionStorage.getItem(SESSION_TOAST_KEY);
    if (alreadyShown === sessionKey) return;

    const lines = summarizeForToast(items);
    if (lines.length === 0) {
      toast.success("You're all caught up", {
        description: "No deadlines, hearings, or document gaps in the next 3 days.",
        duration: 3500,
      });
    } else {
      // Lead with the most urgent line as the toast title.
      const [head, ...rest] = lines;
      const hasCritical = counts.critical > 0;
      toast[hasCritical ? "error" : counts.urgent > 0 ? "warning" : "info"](head, {
        description: rest.length ? rest.join(" · ") : undefined,
        duration: 5000,
      });
    }
    sessionStorage.setItem(SESSION_TOAST_KEY, sessionKey);
  }, [items, sessionKey, counts.critical, counts.urgent]);

  if (!hasAny || dismissed || critical.length === 0) {
    return null;
  }

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-red-200 dark:border-red-900/60 bg-gradient-to-br from-red-50 via-red-50 to-white dark:from-red-950/40 dark:via-red-950/20 dark:to-stone-900/40 shadow-soft animate-fade-in"
      role="alert"
      aria-live="polite"
    >
      <span
        className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-red-200/50 dark:bg-red-500/10 blur-3xl pointer-events-none"
        aria-hidden
      />
      <div className="relative p-5">
        <div className="flex items-start gap-4">
          <span className="relative h-10 w-10 flex items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 flex-shrink-0">
            <AlertTriangle className="h-5 w-5" />
            <span className="absolute inset-0 rounded-xl border border-red-400/40 dark:border-red-500/40 animate-ping" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-red-900 dark:text-red-100 uppercase tracking-wider">
                Needs action now
              </h2>
              <span className="text-[11px] text-red-700/80 dark:text-red-300/80">
                {counts.critical} critical · {counts.urgent} urgent · {counts.warning} warning
              </span>
            </div>
            <ul className="mt-3 space-y-2">
              {critical.slice(0, 3).map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.href ?? "#"}
                    className="group flex items-start gap-3 rounded-xl border border-red-200/70 dark:border-red-900/50 bg-surface px-3 py-2.5 hover:border-red-400 dark:hover:border-red-700 hover:shadow-soft transition"
                  >
                    <IconFor icon={n.icon} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-stone-900 dark:text-stone-50 leading-snug">
                        {n.title}
                      </div>
                      <div className="text-xs text-stone-600 dark:text-stone-400 mt-0.5 truncate">
                        {n.message}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 mt-0.5 text-red-500 dark:text-red-400 group-hover:translate-x-0.5 transition" />
                  </Link>
                </li>
              ))}
            </ul>
            {critical.length > 3 && (
              <div className="mt-2 text-xs text-red-700/80 dark:text-red-300/80">
                +{critical.length - 3} more critical item{critical.length - 3 === 1 ? "" : "s"} — open the bell to review.
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 text-red-400/70 dark:text-red-300/60 hover:text-red-700 dark:hover:text-red-200 hover:bg-red-100/60 dark:hover:bg-red-900/40 rounded-md transition"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * Stand-alone "all caught up" tile for the dashboard when there are zero
 * notifications. Visually calm — complements the banner.
 */
export function AllCaughtUpCard() {
  return (
    <section className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 p-5 flex items-center gap-4">
      <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 flex-shrink-0">
        <CheckCircle2 className="h-5 w-5" />
      </span>
      <div>
        <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
          You&rsquo;re all caught up
        </div>
        <div className="text-xs text-emerald-800/80 dark:text-emerald-200/80 mt-0.5">
          No deadlines, hearings, or document gaps in the next 3 days.
        </div>
      </div>
    </section>
  );
}

function IconFor({ icon }: { icon: NotificationIcon }) {
  const base =
    "h-8 w-8 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200/70 dark:border-red-900/60 flex-shrink-0";
  switch (icon) {
    case "hearing":
      return (
        <span className={base}>
          <Clock3 className="h-4 w-4" />
        </span>
      );
    case "document":
      return (
        <span className={base}>
          <FileQuestion className="h-4 w-4" />
        </span>
      );
    case "deadline":
      return (
        <span className={base}>
          <FileWarning className="h-4 w-4" />
        </span>
      );
    default:
      return (
        <span className={base}>
          <AlertTriangle className="h-4 w-4" />
        </span>
      );
  }
}
