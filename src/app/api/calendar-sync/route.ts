import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { createCalendarEvent, GoogleCalendarError } from "@/lib/google/calendar";
import { getConnectionStatus } from "@/lib/google/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  deadline_id: z.string().min(8),
});

/**
 * POST /api/calendar-sync
 * Creates a Google Calendar event for a deadline and records the mapping.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Bad body" }, { status: 400 });

  const { connected } = await getConnectionStatus(user.id);
  if (!connected) {
    return NextResponse.json(
      { error: "not_connected", message: "Connect Google Calendar first" },
      { status: 409 },
    );
  }

  const sb = supabaseServer();
  // Load deadline + owning case (must belong to this lawyer).
  const { data: deadline, error: dErr } = await sb
    .from("deadlines")
    .select("id, case_id, title, deadline_type, due_date, notes, cases(id, title, lawyer_id, court_name)")
    .eq("id", parsed.data.deadline_id)
    .maybeSingle();
  if (dErr || !deadline) {
    return NextResponse.json({ error: "Deadline not found" }, { status: 404 });
  }
  const caseRow = deadline.cases as unknown as {
    id: string;
    title: string;
    lawyer_id: string;
    court_name: string | null;
  } | null;
  if (!caseRow || caseRow.lawyer_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Mark syncing.
  await sb.from("calendar_sync").upsert(
    {
      user_id: user.id,
      deadline_id: deadline.id,
      provider: "google",
      status: "syncing",
      last_error: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,deadline_id,provider" },
  );

  try {
    const ev = await createCalendarEvent(user.id, {
      title: `${caseRow.title} — ${deadline.title}`,
      description: [
        `Case: ${caseRow.title}`,
        `Type: ${deadline.deadline_type}`,
        deadline.notes ? `Notes: ${deadline.notes}` : null,
        `Synced from Lawris`,
      ]
        .filter(Boolean)
        .join("\n"),
      dueDate: deadline.due_date,
      location: caseRow.court_name,
      reminderMinutes: [60 * 24, 60],
    });

    await sb
      .from("calendar_sync")
      .update({
        status: "synced",
        google_event_id: ev.id,
        last_error: null,
        synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("deadline_id", deadline.id);

    console.log("[calendar-sync] synced", {
      userId: user.id,
      deadlineId: deadline.id,
      eventId: ev.id,
    });
    return NextResponse.json({
      status: "synced",
      google_event_id: ev.id,
      html_link: ev.htmlLink ?? null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "sync failed";
    const status = e instanceof GoogleCalendarError ? e.status : 500;
    console.error("[calendar-sync] FAILED", {
      userId: user.id,
      deadlineId: deadline.id,
      message,
    });
    await sb
      .from("calendar_sync")
      .update({
        status: "failed",
        last_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("deadline_id", deadline.id);
    return NextResponse.json({ error: "sync_failed", message }, { status });
  }
}

/**
 * GET /api/calendar-sync?deadline_ids=a,b,c
 * Returns current sync status for the given deadlines.
 */
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ids = (req.nextUrl.searchParams.get("deadline_ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const sb = supabaseServer();
  const q = sb
    .from("calendar_sync")
    .select("deadline_id, status, google_event_id, last_error, synced_at")
    .eq("user_id", user.id);
  if (ids.length) q.in("deadline_id", ids);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}
