import { supabaseServer } from "@/lib/supabase/server";
import { getLawyerId } from "@/lib/auth/session";
import { classifyUrgency, urgencyClass, daysUntil } from "@/lib/deadlines";
import type { Deadline } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const sb = supabaseServer();
  const lawyerId = await getLawyerId();
  const today = new Date().toISOString().slice(0, 10);

  const { data: cases } = await sb
    .from("cases")
    .select("id")
    .eq("lawyer_id", lawyerId);

  const caseIds = (cases ?? []).map((c) => c.id);

  const deadlines = caseIds.length
    ? await sb
        .from("deadlines")
        .select("*, cases(title)")
        .in("case_id", caseIds)
        .order("due_date")
    : { data: [] };

  const allDeadlines = (deadlines.data ?? []) as (Deadline & { cases: { title: string } })[];
  const upcoming = allDeadlines.filter(d => d.due_date >= today && !d.is_completed);
  const pastOrCompleted = allDeadlines.filter(d => d.due_date < today || d.is_completed);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
        <p className="text-sm text-stone-600">
          Your upcoming deadlines and hearings
        </p>
      </header>

      <section>
        <h2 className="text-sm font-medium text-stone-700 uppercase tracking-wide mb-3">Upcoming</h2>
        {upcoming.length === 0 ? (
          <div className="bg-white border border-dashed border-stone-300 rounded-lg p-8 text-center text-sm text-stone-500">
            No upcoming deadlines.
          </div>
        ) : (
          <ul className="bg-white border border-stone-200 rounded-lg overflow-hidden divide-y divide-stone-100">
            {upcoming.map((d) => {
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

      {pastOrCompleted.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-stone-700 uppercase tracking-wide mb-3">Past & Completed</h2>
          <ul className="bg-stone-50 border border-stone-200 rounded-lg overflow-hidden divide-y divide-stone-100 opacity-75">
            {pastOrCompleted.map((d) => (
              <li key={d.id} className="p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm line-through text-stone-500">{d.title}</div>
                  <div className="text-xs text-stone-400 mt-0.5">{d.cases.title}</div>
                </div>
                <div className="text-xs text-stone-400 whitespace-nowrap">{d.due_date}</div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
