import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { getLawyerId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function CasesPage() {
  const sb = supabaseServer();
  const lawyerId = await getLawyerId();

  const { data: cases } = await sb
    .from("cases")
    .select("*")
    .eq("lawyer_id", lawyerId)
    .order("created_at", { ascending: false });

  const activeCases = cases?.filter(c => c.status === "active") ?? [];
  const otherCases = cases?.filter(c => c.status !== "active") ?? [];

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cases</h1>
          <p className="text-sm text-stone-600">
            Manage your active and historical cases
          </p>
        </div>
        <Link href="/cases/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 bg-indigo-600 text-white hover:bg-indigo-700 h-10 px-4 py-2">
          New Case
        </Link>
      </header>

      {/* active cases */}
      <section>
        <h2 className="text-sm font-medium text-stone-700 uppercase tracking-wide mb-3">Active cases</h2>
        {activeCases.length === 0 ? (
          <div className="bg-white border border-dashed border-stone-300 rounded-lg p-8 text-center text-sm text-stone-500">
            No active cases found.
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeCases.map((c: any) => (
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
                  {c.court_name && <div className="text-xs text-stone-500 mt-1">{c.court_name}</div>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* other cases */}
      {otherCases.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-stone-700 uppercase tracking-wide mb-3">Other cases</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {otherCases.map((c: any) => (
              <li key={c.id}>
                <Link
                  href={`/cases/${c.id}`}
                  className="block bg-white border border-stone-200 rounded-lg p-4 opacity-75 hover:opacity-100 hover:border-indigo-300 hover:shadow-sm transition"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 capitalize">{c.status}</span>
                  </div>
                  <div className="font-medium mt-2">{c.title}</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
