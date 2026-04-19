import { addDays, differenceInCalendarDays } from "date-fns";
import { supabaseServer } from "@/lib/supabase/server";
import type {
  NotificationType,
  NotificationUrgency,
} from "./types";

const HORIZON_DAYS = 14;

type Candidate = {
  user_id: string;
  case_id: string | null;
  source_type: "deadline" | "hearing";
  source_id: string;
  type: NotificationType;
  title: string;
  message: string;
  urgency: NotificationUrgency;
  due_at: string | null;
};

function urgencyFromDays(days: number): NotificationUrgency {
  if (days < 0) return "critical";
  if (days <= 2) return "critical";
  if (days <= 7) return "high";
  if (days <= 30) return "medium";
  return "low";
}

function toMessage(days: number, label: string): string {
  if (days < 0) return `${label} is overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}.`;
  if (days === 0) return `${label} is due today.`;
  if (days === 1) return `${label} is due tomorrow.`;
  return `${label} is due in ${days} days.`;
}

/**
 * Derive reminder notifications from existing case/deadline/hearing data.
 * Fast path: ~3-4 Supabase queries total regardless of candidate count.
 * Silent on any error so a stuck DB can never stall the notification UI.
 */
export async function generateNotificationsForUser(userId: string): Promise<number> {
  try {
    const sb = supabaseServer();
    const todayIso = new Date().toISOString().slice(0, 10);
    const horizonIso = addDays(new Date(), HORIZON_DAYS).toISOString().slice(0, 10);
    const now = new Date();

    const { data: caseRows } = await sb
      .from("cases")
      .select("id, title")
      .eq("lawyer_id", userId);
    const cases = caseRows ?? [];
    if (!cases.length) return 0;
    const caseIds = cases.map((c) => c.id);

    const candidates: Candidate[] = [];

    // 1. Deadlines: not-completed, due within horizon OR already overdue.
    const { data: openDeadlines } = await sb
      .from("deadlines")
      .select("id, case_id, title, deadline_type, due_date, notes")
      .in("case_id", caseIds)
      .eq("is_completed", false)
      .lte("due_date", horizonIso);

    for (const d of openDeadlines ?? []) {
      const due = new Date(d.due_date);
      const days = differenceInCalendarDays(due, now);
      const isOverdue = days < 0;
      const isHearing = d.deadline_type === "hearing";

      const type: NotificationType = isOverdue
        ? "reminder_overdue"
        : isHearing
          ? "upcoming_hearing"
          : "deadline_approaching";

      candidates.push({
        user_id: userId,
        case_id: d.case_id,
        source_type: "deadline",
        source_id: d.id,
        type,
        title: d.title,
        message: toMessage(days, isHearing ? "Hearing" : "Deadline"),
        urgency: urgencyFromDays(days),
        due_at: due.toISOString(),
      });
    }

    // 2. Upcoming hearings from hearing_logs.next_date (if populated).
    const { data: hearings } = await sb
      .from("hearing_logs")
      .select("id, case_id, next_date, next_action")
      .in("case_id", caseIds)
      .not("next_date", "is", null)
      .gte("next_date", todayIso)
      .lte("next_date", horizonIso);

    for (const h of hearings ?? []) {
      if (!h.next_date) continue;
      const due = new Date(h.next_date);
      const days = differenceInCalendarDays(due, now);
      candidates.push({
        user_id: userId,
        case_id: h.case_id,
        source_type: "hearing",
        source_id: h.id,
        type: "upcoming_hearing",
        title: h.next_action ?? "Next hearing",
        message: toMessage(days, "Hearing"),
        urgency: urgencyFromDays(days),
        due_at: due.toISOString(),
      });
    }

    if (!candidates.length) return 0;

    // 3. One SELECT to find existing notifications for these candidates.
    const sourceIds = candidates.map((c) => c.source_id);
    const { data: existingRows, error: selErr } = await sb
      .from("notifications")
      .select("id, source_type, source_id, type")
      .eq("user_id", userId)
      .in("source_id", sourceIds);
    if (selErr) {
      console.warn("[notifications] select failed (likely missing table):", selErr.message);
      return 0;
    }

    const seen = new Set(
      (existingRows ?? []).map(
        (r) => `${r.source_type ?? ""}|${r.source_id ?? ""}|${r.type}`,
      ),
    );

    const fresh = candidates.filter(
      (c) => !seen.has(`${c.source_type}|${c.source_id}|${c.type}`),
    );
    if (!fresh.length) return 0;

    // 4. One bulk INSERT for fresh candidates only. Updates for existing rows
    // are intentionally skipped at hackathon scale — urgency drift is a nice-to-have,
    // not a correctness concern, and keeping this fast matters more.
    const { error: insErr } = await sb.from("notifications").insert(fresh);
    if (insErr) {
      console.warn("[notifications] bulk insert failed:", insErr.message);
      return 0;
    }
    return fresh.length;
  } catch (e) {
    console.warn("[notifications] generate fatal:", e);
    return 0;
  }
}
