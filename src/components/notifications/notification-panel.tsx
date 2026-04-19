"use client";

import Link from "next/link";
import { Bell, CheckCheck, X, ExternalLink, Loader2 } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import type { NotificationWithCase, NotificationUrgency } from "@/lib/notifications/types";

interface Props {
  items: NotificationWithCase[] | null;
  loading: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onMarkAllRead: () => void;
}

const URGENCY_STYLES: Record<
  NotificationUrgency,
  { dot: string; accent: string; label: string }
> = {
  critical: {
    dot: "bg-red-500",
    accent: "border-l-red-500 bg-red-50/40",
    label: "Critical",
  },
  high: {
    dot: "bg-amber-500",
    accent: "border-l-amber-500 bg-amber-50/30",
    label: "High",
  },
  medium: {
    dot: "bg-yellow-500",
    accent: "border-l-yellow-400 bg-yellow-50/20",
    label: "Medium",
  },
  low: {
    dot: "bg-stone-400",
    accent: "border-l-stone-300 bg-white",
    label: "Low",
  },
};

export function NotificationPanel({
  items,
  loading,
  onClose,
  onMarkRead,
  onDismiss,
  onMarkAllRead,
}: Props) {
  const unreadCount = (items ?? []).filter((n) => n.status === "unread").length;

  return (
    <div className="absolute right-0 mt-2 w-96 max-h-[calc(100vh-6rem)] bg-surface border border-stone-200 dark:border-stone-800 rounded-xl shadow-lift overflow-hidden z-50 flex flex-col animate-fade-in">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-stone-700 dark:text-stone-300" />
          <span className="text-sm font-semibold text-stone-900 dark:text-stone-50">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[11px] font-semibold text-white bg-indigo-600 dark:bg-indigo-500 px-1.5 py-0.5 rounded-full tabular-nums">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-xs text-stone-500 dark:text-stone-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-stone-50 dark:hover:bg-stone-800"
              title="Mark all as read"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="overflow-y-auto flex-1 min-h-0">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-stone-400 dark:text-stone-500">
            <Loader2 className="h-5 w-5 animate-spin mb-2" />
            <span className="text-xs">Loading reminders…</span>
          </div>
        ) : (items?.length ?? 0) === 0 ? (
          <div className="py-14 px-6 text-center">
            <div className="mx-auto h-10 w-10 rounded-full bg-surface-muted border border-stone-200 dark:border-stone-700 flex items-center justify-center mb-3">
              <Bell className="h-4 w-4 text-stone-400 dark:text-stone-500" />
            </div>
            <div className="text-sm font-medium text-stone-800 dark:text-stone-200">You&rsquo;re all caught up</div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              New hearings and deadlines will appear here as reminders.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {items!.map((n) => {
              const style = URGENCY_STYLES[n.urgency];
              const isUnread = n.status === "unread";
              const ts = n.due_at ?? n.created_at;
              return (
                <li
                  key={n.id}
                  className={`border-l-2 ${style.accent} ${
                    isUnread ? "bg-opacity-100" : "opacity-75"
                  } transition group`}
                >
                  <div className="px-4 py-3 flex items-start gap-3">
                    <span
                      className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${
                        isUnread ? style.dot : "bg-stone-300"
                      }`}
                      aria-hidden
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-medium text-stone-900 leading-snug">
                          {n.title}
                        </div>
                        <button
                          onClick={() => onDismiss(n.id)}
                          className="p-0.5 rounded text-stone-300 hover:text-stone-600 hover:bg-stone-100 transition opacity-0 group-hover:opacity-100"
                          aria-label="Dismiss"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {n.message && (
                        <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2 text-[11px]">
                        <span
                          className={`uppercase tracking-wide font-medium ${
                            n.urgency === "critical"
                              ? "text-red-700"
                              : n.urgency === "high"
                                ? "text-amber-700"
                                : n.urgency === "medium"
                                  ? "text-yellow-700"
                                  : "text-stone-500"
                          }`}
                        >
                          {style.label}
                        </span>
                        <span className="text-stone-300">·</span>
                        <span className="text-stone-500">
                          {formatRelative(ts)}
                        </span>
                        {n.case_title && (
                          <>
                            <span className="text-stone-300">·</span>
                            <span className="text-stone-500 truncate" title={n.case_title}>
                              {n.case_title}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-[11px]">
                        {n.case_id && (
                          <Link
                            href={`/cases/${n.case_id}`}
                            onClick={() => {
                              onMarkRead(n.id);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1 text-indigo-700 hover:text-indigo-900 font-medium"
                          >
                            View case
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                        {isUnread && (
                          <button
                            onClick={() => onMarkRead(n.id)}
                            className="text-stone-500 hover:text-stone-900"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-stone-100 dark:border-stone-800 px-4 py-2 bg-stone-50/60 dark:bg-stone-900/40">
        <Link
          href="/calendar"
          onClick={onClose}
          className="text-xs text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-200 font-medium"
        >
          Open calendar
        </Link>
      </div>
    </div>
  );
}

function formatRelative(iso: string): string {
  try {
    return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}
