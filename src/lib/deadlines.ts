import { addDays, differenceInDays, parseISO } from "date-fns";

export type Urgency = "critical" | "high" | "medium" | "low";

/**
 * BNSS / CrPC default-bail rule (s.187(3) BNSS, formerly s.167(2) CrPC):
 *   - 90 days when offence is punishable with death, life, or ≥10 years
 *   - 60 days otherwise
 * If chargesheet is not filed by then, accused is entitled to default bail.
 */
export function computeChargesheetDeadline(firDate: Date, offenceMaxYears: number): {
  dueDate: Date;
  windowDays: 60 | 90;
  rationale: string;
} {
  const windowDays: 60 | 90 = offenceMaxYears >= 10 ? 90 : 60;
  const dueDate = addDays(firDate, windowDays);
  const rationale =
    `Chargesheet must be filed within ${windowDays} days of FIR ` +
    `(BNSS s.187(3) — offence carries ${offenceMaxYears < 10 ? "<" : "≥"}10 yrs). ` +
    `On Day ${windowDays + 1}, accused becomes entitled to default bail.`;
  return { dueDate, windowDays, rationale };
}

/**
 * Limitation Act, 1963 — common periods used in MVP scope.
 * NOT exhaustive; covers the cases we seed.
 */
const LIMITATION_PERIODS_DAYS: Record<string, number> = {
  // Civil
  "civil.contract": 3 * 365,
  "civil.tort": 1 * 365,
  "civil.recovery_money": 3 * 365,
  "civil.specific_performance": 3 * 365,
  // Appeals
  "appeal.high_court": 90,
  "appeal.supreme_court": 90,
};

export function computeLimitationDeadline(
  category: string,
  triggerDate: Date,
): { dueDate: Date; days: number } | null {
  const days = LIMITATION_PERIODS_DAYS[category];
  if (!days) return null;
  return { dueDate: addDays(triggerDate, days), days };
}

export function classifyUrgency(dueDate: Date, today: Date = new Date()): Urgency {
  const days = differenceInDays(dueDate, today);
  if (days <= 3) return "critical";
  if (days <= 7) return "high";
  if (days <= 30) return "medium";
  return "low";
}

export function urgencyClass(urgency: Urgency): string {
  switch (urgency) {
    case "critical":
      return "bg-red-50 text-red-900 border-red-300";
    case "high":
      return "bg-amber-50 text-amber-900 border-amber-300";
    case "medium":
      return "bg-yellow-50 text-yellow-900 border-yellow-200";
    case "low":
      return "bg-emerald-50 text-emerald-900 border-emerald-200";
  }
}

export function daysUntil(dueDate: Date | string, today: Date = new Date()): number {
  const due = typeof dueDate === "string" ? parseISO(dueDate) : dueDate;
  return differenceInDays(due, today);
}

/**
 * Builds the auto-generated deadline rows that should be created when a case is registered.
 * Returns plain objects that callers insert into the `deadlines` table.
 */
export type AutoDeadline = {
  title: string;
  deadline_type: "statutory" | "limitation";
  due_date: string;
  notes: string;
};

export function autoDeadlinesForCase(input: {
  caseType: "civil" | "criminal" | "family" | "labour" | "consumer";
  firDate?: Date | null;
  offenceMaxYears?: number | null;
}): AutoDeadline[] {
  const out: AutoDeadline[] = [];
  if (input.caseType === "criminal" && input.firDate && input.offenceMaxYears != null) {
    const r = computeChargesheetDeadline(input.firDate, input.offenceMaxYears);
    out.push({
      title: `Chargesheet deadline (${r.windowDays}-day rule)`,
      deadline_type: "statutory",
      due_date: r.dueDate.toISOString().slice(0, 10),
      notes: r.rationale,
    });
  }
  return out;
}
