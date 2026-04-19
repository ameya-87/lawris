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
 * Idempotent: upserts against (user_id, source_type, source_id, type) unique key.
 */
export async function generateNotificationsForUser(userId: string): Promise<number> {
  const sb = supabaseServer();
  const todayIso = new Date().toISOString().slice(0, 10);
  const horizonIso = addDays(new Date(), HORIZON_DAYS).toISOString().slice(0, 10);
  const now = new Date();

  const { data: caseRows } = await sb
    .from("cases")
    .select("id, title")
    .eq("lawyer_id", userId);
  const cases: { id: string; title: string }[] = caseRows ?? [];
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

  // Upsert each candidate. The unique index on (user_id, source_type, source_id, type)
  // keeps this idempotent, and we update the urgency/message to reflect day-count drift.
  let written = 0;
  for (const c of candidates) {
    const { data: existing } = await sb
      .from("notifications")
      .select("id, status, urgency, message, due_at")
      .eq("user_id", c.user_id)
      .eq("source_type", c.source_type)
      .eq("source_id", c.source_id)
      .eq("type", c.type)
      .maybeSingle();

    if (existing) {
      const needsUpdate =
        existing.urgency !== c.urgency ||
        existing.message !== c.message ||
        existing.due_at !== c.due_at;
      if (needsUpdate && existing.status !== "dismissed") {
        await sb
          .from("notifications")
          .update({
            urgency: c.urgency,
            message: c.message,
            due_at: c.due_at,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        written++;
      }
    } else {
      const { error } = await sb.from("notifications").insert(c);
      if (!error) written++;
    }
  }

  return written;
}
