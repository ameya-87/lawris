import { supabaseServer } from "@/lib/supabase/server";
import { getLawyerId } from "@/lib/auth/session";
import { classifyUrgency, urgencyClass, daysUntil } from "@/lib/deadlines";
import Link from "next/link";
import type { Deadline } from "@/lib/types";

export const dynamic = "force-dynamic";

type Row = Deadline & { cases: { id: string; title: string; case_number: string | null } };

async function loadAll(): Promise<Row[]> {
  const sb = supabaseServer();
  const lawyerId = await getLawyerId();
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
  return (data ?? []) as Row[];
}

export default async function CalendarPage() {
  const items = await loadAll();
  const grouped = groupByUrgency(items);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
        <p className="text-sm text-stone-600 mt-0.5">
          {items.length} open deadlines across all matters, sorted by urgency.
        </p>
      </header>

      {(["critical", "high", "medium", "low"] as const).map((bucket) =>
        grouped[bucket].length === 0 ? null : (
          <section key={bucket}>
            <h2 className="text-xs uppercase tracking-wide text-stone-500 mb-2">
              {bucket} ({grouped[bucket].length})
            </h2>
            <ul className="bg-white border border-stone-200 rounded-lg overflow-hidden divide-y divide-stone-100">
              {grouped[bucket].map((d) => {
                const days = daysUntil(d.due_date);
                return (
                  <li key={d.id} className="p-4 flex items-start gap-4">
                    <div className={`px-2.5 py-1 rounded text-xs font-medium border ${urgencyClass(bucket)} whitespace-nowrap`}>
                      {days === 0 ? "Today" : `in ${days}d`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{d.title}</div>
                      <Link
                        href={`/cases/${d.cases.id}`}
                        className="text-xs text-indigo-700 hover:underline"
                      >
                        {d.cases.title}
                      </Link>
                      {d.notes && (
                        <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">{d.notes}</p>
                      )}
                    </div>
                    <div className="text-xs text-stone-500 whitespace-nowrap">{d.due_date}</div>
                  </li>
                );
              })}
            </ul>
          </section>
        ),
      )}

      {items.length === 0 && (
        <div className="bg-white border border-dashed border-stone-300 rounded-lg p-12 text-center text-sm text-stone-500">
          No open deadlines. (If this is unexpected, check that the seed script ran.)
        </div>
      )}
    </div>
  );
}

function groupByUrgency(items: Row[]) {
  const groups = { critical: [] as Row[], high: [] as Row[], medium: [] as Row[], low: [] as Row[] };
  for (const d of items) {
    const u = classifyUrgency(new Date(d.due_date));
    groups[u].push(d);
  }
  return groups;
}
