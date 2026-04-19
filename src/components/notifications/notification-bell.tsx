"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { NotificationPanel } from "./notification-panel";
import type { NotificationWithCase } from "@/lib/notifications/types";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationWithCase[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load(refresh = false) {
    setLoading(true);
    try {
      const url = refresh ? "/api/notifications?refresh=1" : "/api/notifications";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("load failed");
      const data = (await res.json()) as {
        notifications: NotificationWithCase[];
        unread_count: number;
      };
      setItems(data.notifications);
      setUnread(data.unread_count);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  // Initial badge load — deferred past first paint, and uses the cheap
  // read-only path (no generator run). Poll every 2 min with the same cheap path.
  useEffect(() => {
    const kick = window.setTimeout(() => load(false), 300);
    const t = window.setInterval(() => load(false), 120_000);
    return () => {
      window.clearTimeout(kick);
      window.clearInterval(t);
    };
  }, []);

  // Full refresh (runs the reminder generator) only when the user opens the panel.
  useEffect(() => {
    if (open) load(true);
  }, [open]);

  // Close on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function mutate(id: string, status: "read" | "dismissed") {
    setItems((curr) =>
      curr
        ? status === "dismissed"
          ? curr.filter((n) => n.id !== id)
          : curr.map((n) => (n.id === id ? { ...n, status } : n))
        : curr,
    );
    setUnread((u) => Math.max(0, u - 1));
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => {});
  }

  async function markAllRead() {
    setItems((curr) => curr?.map((n) => ({ ...n, status: "read" as const })) ?? curr);
    setUnread(0);
    await fetch("/api/notifications/read-all", { method: "POST" }).catch(() => {});
  }

  const hasCritical = (items ?? []).some(
    (n) => n.urgency === "critical" && n.status === "unread",
  );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-1.5 rounded-md text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white transition"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        aria-expanded={open}
      >
        <Bell className={`h-4 w-4 ${hasCritical ? "animate-pulse" : ""}`} />
        {unread > 0 && (
          <>
            {hasCritical && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-red-500/60 animate-ping pointer-events-none"
                aria-hidden
              />
            )}
            <span
              className={`absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full text-[10px] font-semibold text-white flex items-center justify-center tabular-nums shadow-sm ring-2 ring-background ${
                hasCritical ? "bg-red-600" : "bg-indigo-600"
              }`}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          </>
        )}
      </button>

      {open && (
        <NotificationPanel
          items={items}
          loading={loading && !items}
          onClose={() => setOpen(false)}
          onMarkRead={(id) => mutate(id, "read")}
          onDismiss={(id) => mutate(id, "dismissed")}
          onMarkAllRead={markAllRead}
        />
      )}
    </div>
  );
}
