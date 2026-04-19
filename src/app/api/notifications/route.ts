import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { generateNotificationsForUser } from "@/lib/notifications/generate";
import type { NotificationRow, NotificationWithCase } from "@/lib/notifications/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/notifications[?refresh=1]
 *
 * By default does a single cheap SELECT. If `?refresh=1` is passed, runs the
 * reminder generator first. This keeps the header bell snappy on every page
 * load; the bell explicitly triggers refresh when the dropdown is opened.
 *
 * Fault-tolerant: returns an empty list (200) on any DB error instead of
 * 500, so a missing migration can't stall the UI with a perpetual spinner.
 */
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shouldRefresh = req.nextUrl.searchParams.get("refresh") === "1";
  if (shouldRefresh) {
    await generateNotificationsForUser(user.id).catch((e) => {
      console.warn("[api/notifications] generate failed", e);
    });
  }

  try {
    const sb = supabaseServer();
    const { data, error } = await sb
      .from("notifications")
      .select("*, cases(title)")
      .eq("user_id", user.id)
      .neq("status", "dismissed")
      .order("urgency", { ascending: true })
      .order("due_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.warn("[api/notifications] select failed:", error.message);
      return NextResponse.json({ notifications: [], unread_count: 0 });
    }

    const rows: NotificationWithCase[] = (data ?? []).map((r) => {
      const { cases, ...rest } = r as NotificationRow & { cases: { title: string } | null };
      return { ...rest, case_title: cases?.title ?? null };
    });
    const unread = rows.filter((n) => n.status === "unread").length;
    return NextResponse.json({ notifications: rows, unread_count: unread });
  } catch (e) {
    console.warn("[api/notifications] fatal:", e);
    return NextResponse.json({ notifications: [], unread_count: 0 });
  }
}
