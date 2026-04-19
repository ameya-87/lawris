import { supabaseServer } from "@/lib/supabase/server";
import { getLawyerId } from "@/lib/auth/session";
import { getConnectionStatus } from "@/lib/google/oauth";
import { CalendarView, type CalendarDeadline } from "@/components/calendar/calendar-view";
import type { Deadline } from "@/lib/types";

export const dynamic = "force-dynamic";

type Row = Deadline & {
  cases: { id: string; title: string; case_number: string | null };
};
type SyncStatus = "idle" | "syncing" | "synced" | "failed";

async function loadAll(lawyerId: string): Promise<CalendarDeadline[]> {
  try {
    const sb = supabaseServer();
    const { data: caseIds } = await sb
      .from("cases")
      .select("id")
      .eq("lawyer_id", lawyerId);
    const ids = (caseIds ?? []).map((r) => r.id);
    if (!ids.length) return [];
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await sb
      .from("deadlines")
      .select("*, cases(id, title, case_number)")
      .in("case_id", ids)
      .eq("is_completed", false)
      .gte("due_date", today)
      .order("due_date");
    const rows = (data ?? []) as Row[];
    return rows.map((d) => ({
      id: d.id,
      title: d.title,
      due_date: d.due_date,
      deadline_type: d.deadline_type,
      notes: d.notes,
      case_id: d.cases.id,
      case_title: d.cases.title,
      case_number: d.cases.case_number,
    }));
  } catch (e) {
    console.error("[calendar/page] loadAll failed", e);
    return [];
  }
}

async function loadSyncMap(
  lawyerId: string,
  deadlineIds: string[],
): Promise<Record<string, { status: SyncStatus; event_link: string | null }>> {
  if (!deadlineIds.length) return {};
  try {
    const sb = supabaseServer();
    const { data, error } = await sb
      .from("calendar_sync")
      .select("deadline_id, status, google_event_id")
      .eq("user_id", lawyerId)
      .in("deadline_id", deadlineIds);
    if (error) {
      // Table missing or RLS blocking — don't crash SSR, just treat everything as unsynced.
      console.warn("[calendar/page] calendar_sync query warning:", error.message);
      return {};
    }
    const map: Record<string, { status: SyncStatus; event_link: string | null }> = {};
    for (const r of data ?? []) {
      const raw = r.status as string;
      const status: SyncStatus =
        raw === "synced" ? "synced" : raw === "failed" ? "failed" : raw === "syncing" ? "syncing" : "idle";
      map[r.deadline_id as string] = {
        status,
        event_link: r.google_event_id
          ? `https://calendar.google.com/calendar/u/0/r/eventedit/${encodeURIComponent(String(r.google_event_id))}`
          : null,
      };
    }
    return map;
  } catch (e) {
    console.error("[calendar/page] loadSyncMap failed", e);
    return {};
  }
}

async function safeConnectionStatus(lawyerId: string): Promise<boolean> {
  try {
    const s = await getConnectionStatus(lawyerId);
    return s.connected;
  } catch (e) {
    console.warn("[calendar/page] getConnectionStatus failed, assuming disconnected", e);
    return false;
  }
}

export default async function CalendarPage() {
  let lawyerId: string;
  try {
    lawyerId = await getLawyerId();
  } catch (e) {
    console.error("[calendar/page] getLawyerId failed", e);
    // Middleware should normally prevent this, but render an empty shell instead of crashing.
    return (
      <CalendarView items={[]} initialConnected={false} initialSyncMap={{}} />
    );
  }

  const [items, connected] = await Promise.all([
    loadAll(lawyerId),
    safeConnectionStatus(lawyerId),
  ]);
  const syncMap = await loadSyncMap(lawyerId, items.map((d) => d.id));

  return (
    <CalendarView
      items={items}
      initialConnected={connected}
      initialSyncMap={syncMap}
    />
  );
}
