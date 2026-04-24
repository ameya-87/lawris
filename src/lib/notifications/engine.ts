import { differenceInCalendarDays } from "date-fns";

/**
 * Pure, synchronous client-side notification engine.
 *
 * Given already-loaded case / deadline / hearing / document data, produces a
 * ranked list of user-facing alerts. Deterministic, no I/O, no RAG — safe to
 * call on every page load, every navigation, with no backend dependency.
 *
 * Spec-driven severity mapping:
 *   - deadline today, hearing today, overdue  → "critical"
 *   - deadline tomorrow, hearing tomorrow      → "urgent"
 *   - deadline within 3 days                   → "warning"
 *   - case with no documents (active matter)   → "warning"
 *   - general info                             → "info"
 */

export type NotificationType = "critical" | "urgent" | "warning" | "info";
export type NotificationIcon = "deadline" | "hearing" | "document" | "info";

export interface ClientNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  caseId?: string;
  caseTitle?: string;
  href?: string;
  timestamp: string; // ISO — serializable across the RSC boundary
  icon: NotificationIcon;
}

export interface EngineCase {
  id: string;
  title: string;
  case_type: string;
  phase: string;
  status: string;
  document_count: number;
}

export interface EngineDeadline {
  id: string;
  case_id: string;
  case_title: string;
  title: string;
  due_date: string;          // YYYY-MM-DD
  deadline_type: string;
}

export interface EngineHearing {
  id: string;
  case_id: string;
  case_title: string;
  next_date: string;          // YYYY-MM-DD
  next_action: string | null;
}

export interface EngineInput {
  cases: EngineCase[];
  deadlines: EngineDeadline[];
  hearings: EngineHearing[];
  /** Optional override for "now" — useful for tests / demos. */
  now?: Date;
}

const RANK: Record<NotificationType, number> = {
  critical: 0,
  urgent: 1,
  warning: 2,
  info: 3,
};

function whenLabel(days: number): string {
  if (days < 0) return `overdue by ${Math.abs(days)}d`;
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days}d`;
}

export function generateNotifications(input: EngineInput): ClientNotification[] {
  const now = input.now ?? new Date();
  const out: ClientNotification[] = [];

  // 1. Deadlines (includes any deadline of type "hearing").
  for (const d of input.deadlines) {
    const due = new Date(d.due_date);
    const days = differenceInCalendarDays(due, now);
    let type: NotificationType | null = null;
    if (days < 0) type = "critical";
    else if (days === 0) type = "critical";
    else if (days === 1) type = "urgent";
    else if (days <= 3) type = "warning";
    if (!type) continue;

    const isHearing = d.deadline_type === "hearing";
    out.push({
      id: `deadline-${d.id}`,
      type,
      title: d.title,
      message: `${d.case_title} · ${isHearing ? "hearing" : "deadline"} ${whenLabel(days)}`,
      caseId: d.case_id,
      caseTitle: d.case_title,
      href: `/cases/${d.case_id}`,
      timestamp: due.toISOString(),
      icon: isHearing ? "hearing" : "deadline",
    });
  }

  // 2. Hearings pulled from hearing_logs.next_date.
  for (const h of input.hearings) {
    const due = new Date(h.next_date);
    const days = differenceInCalendarDays(due, now);
    if (days < 0 || days > 1) continue; // spec: today or tomorrow
    out.push({
      id: `hearing-${h.id}`,
      type: days === 0 ? "critical" : "urgent",
      title: h.next_action ?? "Next hearing",
      message: `${h.case_title} · hearing ${whenLabel(days)}`,
      caseId: h.case_id,
      caseTitle: h.case_title,
      href: `/cases/${h.case_id}`,
      timestamp: due.toISOString(),
      icon: "hearing",
    });
  }

  // 3. Missing-document alerts on active matters.
  for (const c of input.cases) {
    if (c.status !== "active") continue;
    if (c.document_count === 0) {
      out.push({
        id: `no-docs-${c.id}`,
        type: "warning",
        title: "No documents uploaded",
        message: `${c.title} · add FIR, plaint, or affidavit to enable AI research`,
        caseId: c.id,
        caseTitle: c.title,
        href: `/cases/${c.id}`,
        timestamp: now.toISOString(),
        icon: "document",
      });
    }
  }

  // Deduplicate by id — protects against double-entries if the caller passes
  // overlapping deadline/hearing rows.
  const seen = new Set<string>();
  const unique = out.filter((n) => {
    if (seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });

  // Sort: severity first, then imminent timestamps first.
  unique.sort(
    (a, b) =>
      RANK[a.type] - RANK[b.type] ||
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  return unique;
}

/** Count of each severity, for badges/banners/toasts. */
export function countBySeverity(items: ClientNotification[]): Record<NotificationType, number> {
  return items.reduce(
    (acc, n) => {
      acc[n.type]++;
      return acc;
    },
    { critical: 0, urgent: 0, warning: 0, info: 0 } as Record<NotificationType, number>,
  );
}

/**
 * Human-readable summary lines for the welcome toasts.
 * Example output: ["2 critical deadlines today", "1 hearing tomorrow"]
 */
export function summarizeForToast(items: ClientNotification[]): string[] {
  const criticalDeadlines = items.filter(
    (n) => n.type === "critical" && n.icon === "deadline",
  ).length;
  const criticalHearings = items.filter(
    (n) => n.type === "critical" && n.icon === "hearing",
  ).length;
  const urgentDeadlines = items.filter(
    (n) => n.type === "urgent" && n.icon === "deadline",
  ).length;
  const urgentHearings = items.filter(
    (n) => n.type === "urgent" && n.icon === "hearing",
  ).length;
  const docWarnings = items.filter(
    (n) => n.type === "warning" && n.icon === "document",
  ).length;

  const lines: string[] = [];
  if (criticalDeadlines)
    lines.push(`${criticalDeadlines} critical deadline${criticalDeadlines === 1 ? "" : "s"} today`);
  if (criticalHearings)
    lines.push(`${criticalHearings} hearing${criticalHearings === 1 ? "" : "s"} today`);
  if (urgentDeadlines)
    lines.push(`${urgentDeadlines} deadline${urgentDeadlines === 1 ? "" : "s"} due tomorrow`);
  if (urgentHearings)
    lines.push(`${urgentHearings} hearing${urgentHearings === 1 ? "" : "s"} tomorrow`);
  if (docWarnings)
    lines.push(`${docWarnings} case${docWarnings === 1 ? "" : "s"} missing documents`);
  return lines;
}
