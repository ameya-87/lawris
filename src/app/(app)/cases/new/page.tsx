"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCasePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseType, setCaseType] = useState<"civil" | "criminal" | "family" | "labour" | "consumer">("criminal");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      title: fd.get("title"),
      case_type: caseType,
      case_number: fd.get("case_number") || null,
      court_name: fd.get("court_name") || null,
      court_type: fd.get("court_type") || null,
      opposing_party: fd.get("opposing_party") || null,
      notes: fd.get("notes") || null,
    };
    if (caseType === "criminal") {
      body.fir_date = fd.get("fir_date") || null;
      body.fir_number = fd.get("fir_number") || null;
      body.police_station = fd.get("police_station") || null;
      body.sections = fd.get("sections") || null;
      const oy = fd.get("offence_max_years");
      body.offence_max_years = oy ? Number(oy) : null;
      body.arrest_date = fd.get("arrest_date") || null;
    }
    const res = await fetch("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setError(`Failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
      setSubmitting(false);
      return;
    }
    const json = await res.json();
    router.push(`/cases/${json.case.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New case</h1>
        <p className="text-sm text-stone-600 mt-0.5">
          For criminal matters, providing FIR date + max sentence auto-computes the chargesheet deadline.
        </p>
      </header>

      <form onSubmit={onSubmit} className="bg-white border border-stone-200 rounded-lg p-6 space-y-5">
        <Field label="Title">
          <input name="title" required placeholder="State of Maharashtra vs. ..." className={input} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Case type">
            <select
              name="case_type"
              value={caseType}
              onChange={(e) => setCaseType(e.target.value as typeof caseType)}
              className={input}
            >
              <option value="criminal">Criminal</option>
              <option value="civil">Civil</option>
              <option value="family">Family</option>
              <option value="labour">Labour</option>
              <option value="consumer">Consumer</option>
            </select>
          </Field>
          <Field label="Case number (if assigned)">
            <input name="case_number" placeholder="CC/123/2026" className={input} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Court name">
            <input name="court_name" placeholder="Sessions Court, Pune" className={input} />
          </Field>
          <Field label="Court type">
            <select name="court_type" className={input} defaultValue="">
              <option value="">—</option>
              <option value="magistrate">Magistrate</option>
              <option value="sessions">Sessions</option>
              <option value="district">District</option>
              <option value="high_court">High Court</option>
              <option value="supreme_court">Supreme Court</option>
              <option value="tribunal">Tribunal</option>
            </select>
          </Field>
        </div>

        <Field label="Opposing party">
          <input name="opposing_party" placeholder="State / defendant name" className={input} />
        </Field>

        {caseType === "criminal" && (
          <fieldset className="border border-stone-200 rounded-md p-4 space-y-4">
            <legend className="px-2 text-xs uppercase tracking-wide text-stone-500">Investigation details</legend>
            <div className="grid grid-cols-2 gap-4">
              <Field label="FIR number">
                <input name="fir_number" placeholder="FIR 0289/2026" className={input} />
              </Field>
              <Field label="FIR date">
                <input type="date" name="fir_date" className={input} />
              </Field>
            </div>
            <Field label="Police station">
              <input name="police_station" placeholder="Chaturshringi P.S., Pune" className={input} />
            </Field>
            <Field label="Sections charged">
              <input name="sections" placeholder="s.420 IPC; s.318 BNS" className={input} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Max sentence (years)" hint="≥10 = 90-day chargesheet rule, else 60-day">
                <input type="number" name="offence_max_years" min={0} max={100} className={input} />
              </Field>
              <Field label="Arrest date">
                <input type="date" name="arrest_date" className={input} />
              </Field>
            </div>
          </fieldset>
        )}

        <Field label="Notes">
          <textarea
            name="notes"
            rows={4}
            placeholder="Brief facts, strategy notes, etc."
            className={input}
          />
        </Field>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-900 text-sm rounded p-3">{error}</div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-stone-600 hover:text-stone-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-indigo-700 text-white text-sm px-4 py-2 rounded-md hover:bg-indigo-800 disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create case"}
          </button>
        </div>
      </form>
    </div>
  );
}

const input =
  "w-full text-sm px-3 py-2 bg-white border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-stone-700 mb-1.5">
        {label}
        {hint && <span className="ml-2 text-stone-400 font-normal">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
