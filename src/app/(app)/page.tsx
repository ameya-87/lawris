import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { getLawyerId, getSessionUser } from "@/lib/auth/session";
import { classifyUrgency, daysUntil } from "@/lib/deadlines";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock3,
  FileWarning,
  Sparkles,
} from "lucide-react";
import type { Deadline, Case } from "@/lib/types";
import { StatusBadge, urgencyToTone } from "@/components/ui/status-badge";
import {
  CriticalBanner,
  AllCaughtUpCard,
} from "@/components/notifications/critical-banner";
import {
  generateNotifications,
  type EngineInput,
} from "@/lib/notifications/engine";
import { addDays } from "date-fns";

export const dynamic = "force-dynamic";

async function loadDashboard() {
  const sb = supabaseServer();
  const lawyerId = await getLawyerId();
  const today = new Date().toISOString().slice(0, 10);
  const horizon3d = addDays(new Date(), 3).toISOString().slice(0, 10);

  const cases = await sb
    .from("cases")
    .select("id, title, case_type, phase, status, ai_summary")
    .eq("lawyer_id", lawyerId);

  const caseIds = (cases.data ?? []).map((c) => c.id);
  const [deadlines, upcomingHearings, documents] = await Promise.all([
    caseIds.length
      ? sb
          .from("deadlines")
          .select("*, cases(id, title)")
          .in("case_id", caseIds)
          .eq("is_completed", false)
          .gte("due_date", today)
          .order("due_date")
          .limit(20)
      : Promise.resolve({ data: [] as unknown[] } as { data: unknown[] }),
    caseIds.length
      ? sb
          .from("hearing_logs")
          .select("id, case_id, next_date, next_action, cases(title)")
          .in("case_id", caseIds)
          .not("next_date", "is", null)
          .gte("next_date", today)
          .lte("next_date", horizon3d)
      : Promise.resolve({ data: [] as unknown[] } as { data: unknown[] }),
    caseIds.length
      ? sb.from("documents").select("case_id").in("case_id", caseIds)
      : Promise.resolve({ data: [] as unknown[] } as { data: unknown[] }),
  ]);

  const deadlineRows = (deadlines.data ?? []) as (Deadline & {
    cases: { id: string; title: string };
  })[];
  const hearingRows = (upcomingHearings.data ?? []) as Array<{
    id: string;
    case_id: string;
    next_date: string;
    next_action: string | null;
    cases: { title: string } | null;
  }>;
  const docRows = (documents.data ?? []) as Array<{ case_id: string }>;

  // Build document_count map.
  const docCountBy: Record<string, number> = {};
  for (const d of docRows) {
    docCountBy[d.case_id] = (docCountBy[d.case_id] ?? 0) + 1;
  }

  const caseList = (cases.data ?? []) as Case[];

  const engineInput: EngineInput = {
    cases: caseList.map((c) => ({
      id: c.id,
      title: c.title,
      case_type: c.case_type,
      phase: c.phase,
      status: c.status,
      document_count: docCountBy[c.id] ?? 0,
    })),
    deadlines: deadlineRows.map((d) => ({
      id: d.id,
      case_id: d.case_id,
      case_title: d.cases?.title ?? "Unknown case",
      title: d.title,
      due_date: d.due_date,
      deadline_type: d.deadline_type,
    })),
    hearings: hearingRows.map((h) => ({
      id: h.id,
      case_id: h.case_id,
      case_title: h.cases?.title ?? "Unknown case",
      next_date: h.next_date,
      next_action: h.next_action,
    })),
  };

  return {
    cases: caseList,
    deadlines: deadlineRows.slice(0, 8),
    engineInput,
  };
}

type NextAction = {
  tone: "red" | "amber" | "blue";
  title: string;
  sub: string;
  href: string;
  icon: React.ReactNode;
};

function deriveNextActions(
  deadlines: (Deadline & { cases: { id: string; title: string } })[],
  cases: Case[],
): NextAction[] {
  const out: NextAction[] = [];
  const now = new Date();
  for (const d of deadlines.slice(0, 3)) {
    const u = classifyUrgency(new Date(d.due_date), now);
    const days = daysUntil(d.due_date, now);
    const tone: NextAction["tone"] = u === "critical" ? "red" : u === "high" ? "amber" : "blue";
    out.push({
      tone,
      title: d.title,
      sub: `${d.cases.title} · ${days <= 0 ? "today" : `in ${days}d`}`,
      href: `/cases/${d.case_id}`,
      icon:
        d.deadline_type === "hearing" ? <Clock3 className="h-4 w-4" /> : <FileWarning className="h-4 w-4" />,
    });
  }

  const needsSummary = cases.find((c) => !c.ai_summary);
  if (needsSummary && out.length < 4) {
    out.push({
      tone: "blue",
      title: "Generate AI summary",
      sub: `${needsSummary.title} — no case summary yet`,
      href: `/cases/${needsSummary.id}`,
      icon: <Sparkles className="h-4 w-4" />,
    });
  }

  if (out.length === 0) {
    out.push({
      tone: "blue",
      title: "Create your first case",
      sub: "Add a matter to start tracking deadlines and hearings",
      href: "/cases/new",
      icon: <Sparkles className="h-4 w-4" />,
    });
  }
  return out;
}

export default async function DashboardPage() {
  const [{ cases, deadlines, engineInput }, user] = await Promise.all([
    loadDashboard(),
    getSessionUser(),
  ]);
  const critical = deadlines.filter((d) => classifyUrgency(new Date(d.due_date)) === "critical");
  const high = deadlines.filter((d) => classifyUrgency(new Date(d.due_date)) === "high");
  const active = cases.filter((c) => c.status === "active");
  const nextActions = deriveNextActions(deadlines, cases);

  // Run the pure frontend engine on the server so the banner + toasts have
  // data immediately on first paint. No extra network round-trip.
  const notifications = generateNotifications(engineInput);
  const hasAnyAlerts = notifications.length > 0;

  const firstName = user?.full_name?.split(/\s+/)[0] ?? "Advocate";

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <div className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400">
          Today&rsquo;s overview
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Welcome back, {firstName}.
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {active.length} active matters · {critical.length} critical · {high.length} due this week
        </p>
      </header>

      {hasAnyAlerts ? (
        <CriticalBanner items={notifications} />
      ) : (
        <AllCaughtUpCard />
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <OverviewCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Critical (≤ 3 days)"
          value={critical.length}
          tone="red"
        />
        <OverviewCard
          icon={<FileWarning className="h-4 w-4" />}
          label="Due this week"
          value={high.length}
          tone="amber"
        />
        <OverviewCard
          icon={<Briefcase className="h-4 w-4" />}
          label="Active matters"
          value={active.length}
          tone="muted"
        />
      </section>

      <section>
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-indigo-700 dark:text-indigo-400 font-semibold">
              Next actions
            </div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50 mt-1">
              What needs your attention today
            </h2>
          </div>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {nextActions.map((a, i) => (
            <li key={i}>
              <Link
                href={a.href}
                className="group flex items-start gap-3 bg-surface border border-stone-200 dark:border-stone-800 rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-soft transition"
              >
                <span
                  className={`mt-0.5 h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    a.tone === "red"
                      ? "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                      : a.tone === "amber"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                        : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                  }`}
                >
                  {a.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-stone-900 dark:text-stone-50 leading-snug">
                    {a.title}
                  </div>
                  <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                    {a.sub}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-stone-300 dark:text-stone-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="flex items-end justify-between mb-3">
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300 uppercase tracking-wide">
            Upcoming deadlines
          </h2>
          <Link
            href="/calendar"
            className="text-xs text-indigo-700 dark:text-indigo-300 hover:underline flex items-center gap-1"
          >
            See all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {deadlines.length === 0 ? (
          <EmptyState text="No deadlines in the next 60 days. You're on top of things." />
        ) : (
          <ul className="bg-surface border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden divide-y divide-stone-100 dark:divide-stone-800 shadow-soft">
            {deadlines.map((d) => {
              const u = classifyUrgency(new Date(d.due_date));
              const days = daysUntil(d.due_date);
              return (
                <li
                  key={d.id}
                  className="p-4 flex items-start gap-4 hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition"
                >
                  <StatusBadge tone={urgencyToTone(u)} size="md">
                    {days <= 0 ? "Today" : `${days}d`}
                  </StatusBadge>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-stone-900 dark:text-stone-50">
                      {d.title}
                    </div>
                    <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      {d.cases.title}
                    </div>
                    {d.notes && (
                      <div className="text-xs text-stone-600 dark:text-stone-400 mt-1.5 leading-relaxed line-clamp-2">
                        {d.notes}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300 uppercase tracking-wide mb-3">
          Active cases
        </h2>
        {cases.length === 0 ? (
          <EmptyState text="No cases yet. Create one from the Cases page to begin." />
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cases.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/cases/${c.id}`}
                  className="block bg-surface border border-stone-200 dark:border-stone-800 rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-soft transition"
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <Pill>{c.case_type}</Pill>
                    <Pill>{c.phase}</Pill>
                    <StatusBadge tone={caseStatusTone(c.status)}>{c.status}</StatusBadge>
                  </div>
                  <div className="font-medium mt-2 text-stone-900 dark:text-stone-50">
                    {c.title}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function caseStatusTone(status: string): "green" | "grey" | "amber" | "blue" {
  switch (status) {
    case "active":
      return "green";
    case "stayed":
      return "amber";
    case "appealed":
      return "blue";
    default:
      return "grey";
  }
}

function OverviewCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "red" | "amber" | "muted";
}) {
  const toneClass =
    tone === "red"
      ? "bg-red-50 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-100"
      : tone === "amber"
        ? "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-100"
        : "bg-surface border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-50";
  return (
    <div className={`border rounded-xl p-5 shadow-soft ${toneClass}`}>
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider opacity-80">
        {icon}
        {label}
      </div>
      <div className="text-3xl font-semibold mt-2 tabular-nums">{value}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-surface border border-dashed border-stone-300 dark:border-stone-700 rounded-xl p-8 text-center text-sm text-stone-500 dark:text-stone-400 flex flex-col items-center gap-2">
      <CheckCircle2 className="h-5 w-5 text-stone-300 dark:text-stone-600" />
      {text}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 capitalize text-[10px]">
      {children}
    </span>
  );
}
