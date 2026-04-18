import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { getLawyerId } from "@/lib/auth/session";
import { Plus } from "lucide-react";
import type { Case } from "@/lib/types";

export const dynamic = "force-dynamic";

type CaseRow = Case & { clients: { full_name: string } | null };

async function loadCases(): Promise<CaseRow[]> {
  const sb = supabaseServer();
  const lawyerId = await getLawyerId();
  const { data } = await sb
    .from("cases")
    .select("*, clients(full_name)")
    .eq("lawyer_id", lawyerId)
    .order("created_at", { ascending: false });
  return (data ?? []) as CaseRow[];
}

export default async function CasesPage() {
  const cases = await loadCases();
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cases</h1>
          <p className="text-sm text-stone-600 mt-0.5">{cases.length} matters</p>
        </div>
        <Link
          href="/cases/new"
          className="inline-flex items-center gap-1.5 bg-indigo-700 text-white text-sm px-3.5 py-2 rounded-md hover:bg-indigo-800"
        >
          <Plus className="h-4 w-4" /> New case
        </Link>
      </header>

      {cases.length === 0 ? (
        <div className="bg-white border border-dashed border-stone-300 rounded-lg p-12 text-center">
          <p className="text-sm text-stone-500 mb-4">No cases yet.</p>
          <Link
            href="/cases/new"
            className="inline-flex items-center gap-1.5 text-indigo-700 hover:underline text-sm"
          >
            <Plus className="h-4 w-4" /> Create your first case
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="text-left p-3 font-medium">Case</th>
                <th className="text-left p-3 font-medium">Client</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Phase</th>
                <th className="text-left p-3 font-medium">Court</th>
                <th className="text-left p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {cases.map((c) => (
                <tr key={c.id} className="hover:bg-stone-50">
                  <td className="p-3">
                    <Link href={`/cases/${c.id}`} className="font-medium text-indigo-700 hover:underline">
                      {c.title}
                    </Link>
                    {c.case_number && <div className="text-xs text-stone-500 mt-0.5">{c.case_number}</div>}
                  </td>
                  <td className="p-3 text-stone-700">{c.clients?.full_name ?? "—"}</td>
                  <td className="p-3 capitalize">{c.case_type}</td>
                  <td className="p-3 capitalize">{c.phase}</td>
                  <td className="p-3 text-stone-700">{c.court_name ?? "—"}</td>
                  <td className="p-3">
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 capitalize">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
