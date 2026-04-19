import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { getLawyerId } from "@/lib/auth/session";
import { classifyUrgency, urgencyClass, daysUntil } from "@/lib/deadlines";
import { AlertTriangle, ArrowRight, Briefcase, FileWarning } from "lucide-react";
import type { Deadline, Case } from "@/lib/types";

export const dynamic = "force-dynamic";

async function loadDashboard() {
  const sb = supabaseServer();
  const lawyerId = await getLawyerId();
  const today = new Date().toISOString().slice(0, 10);

  const cases = await sb
    .from("cases")
    .select("id, title, case_type, phase, status")
    .eq("lawyer_id", lawyerId);

  const caseIds = (cases.data ?? []).map((c) => c.id);
  const deadlines = caseIds.length
    ? await sb
        .from("deadlines")
        .select("*, cases(title)")
        .in("case_id", caseIds)
        .eq("is_completed", false)
        .gte("due_date", today)
        .order("due_date")
        .limit(8)
    : { data: [] };

  return {
    cases: (cases.data ?? []) as Case[],
    deadlines: (deadlines.data ?? []) as (Deadline & { cases: { title: string } })[],
  };
}

export default async function DashboardPage() {
  const { cases, deadlines } = await loadDashboard();
  const critical = deadlines.filter((d) => classifyUrgency(new Date(d.due_date)) === "critical");
  const high = deadlines.filter((d) => classifyUrgency(new Date(d.due_date)) === "high");
  const active = cases.filter((c) => c.status === "active");

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Today&rsquo;s docket</h1>
        <p className="text-sm text-stone-600">
          {active.length} active matters · {critical.length} critical · {high.length} due this week
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Critical (≤ 3 days)"
          value={critical.length}
          tone="critical"
        />
        <SummaryCard
          icon={<FileWarning className="h-4 w-4" />}
          label="High (≤ 7 days)"
          value={high.length}
          tone="high"
        />
        <SummaryCard
          icon={<Briefcase className="h-4 w-4" />}
          label="Active matters"
          value={active.length}
          tone="muted"
        />
      </section>

      <section>
        <div className="flex items-end justify-between mb-3">
          <h2 className="text-sm font-medium text-stone-700 uppercase tracking-wide">
            Upcoming deadlines
          </h2>
          <Link href="/calendar" className="text-xs text-indigo-700 hover:underline flex items-center gap-1">
            See all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {deadlines.length === 0 ? (
          <EmptyState text="No deadlines in the next 60 days. Either you're on top of things or no cases are seeded yet." />
        ) : (
          <ul className="bg-white border border-stone-200 rounded-lg overflow-hidden divide-y divide-stone-100">
            {deadlines.map((d) => {
              const u = classifyUrgency(new Date(d.due_date));
              const days = daysUntil(d.due_date);
              return (
                <li key={d.id} className="p-4 flex items-start gap-4">
                  <div className={`px-2.5 py-1 rounded text-xs font-medium border ${urgencyClass(u)}`}>
                    {days <= 0 ? "Today" : `${days}d`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{d.title}</div>
                    <div className="text-xs text-stone-500 mt-0.5">{d.cases.title}</div>
                    {d.notes && <div className="text-xs text-stone-600 mt-1.5 leading-relaxed">{d.notes}</div>}
                  </div>
                  <div className="text-xs text-stone-500 whitespace-nowrap">{d.due_date}</div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium text-stone-700 uppercase tracking-wide mb-3">Active cases</h2>
        {cases.length === 0 ? (
          <EmptyState text="No cases yet. Create one from the Cases page to begin." />
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cases.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/cases/${c.id}`}
                  className="block bg-white border border-stone-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-sm transition"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 capitalize">{c.case_type}</span>
                    <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 capitalize">{c.phase}</span>
                  </div>
                  <div className="font-medium mt-2">{c.title}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "critical" | "high" | "muted";
}) {
  const toneClass =
    tone === "critical"
      ? "bg-red-50 border-red-200 text-red-900"
      : tone === "high"
        ? "bg-amber-50 border-amber-200 text-amber-900"
        : "bg-white border-stone-200 text-stone-900";
  return (
    <div className={`border rounded-lg p-4 ${toneClass}`}>
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide opacity-80">
        {icon}
        {label}
      </div>
      <div className="text-3xl font-semibold mt-2 tabular-nums">{value}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-white border border-dashed border-stone-300 rounded-lg p-8 text-center text-sm text-stone-500">
      {text}
    </div>
  );
}
