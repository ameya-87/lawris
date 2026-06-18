"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCaseAction } from "./actions";
import { toast } from "sonner";

export default function NewCasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createCaseAction(formData);
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else if (res.id) {
      toast.success("Case created");
      router.push(`/cases/${res.id}`);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New Case</h1>
        <p className="text-sm text-stone-600">Create a new matter in your workspace</p>
      </header>

      <form onSubmit={onSubmit} className="space-y-6 bg-white border border-stone-200 rounded-lg p-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <Input name="title" required placeholder="e.g. State vs. Sharma" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Case Type</label>
            <select name="case_type" required className="flex h-10 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">
              <option value="civil">Civil</option>
              <option value="criminal">Criminal</option>
              <option value="family">Family</option>
              <option value="labour">Labour</option>
              <option value="consumer">Consumer</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Phase</label>
            <select name="phase" required className="flex h-10 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">
              <option value="intake">Intake</option>
              <option value="pretrial">Pretrial</option>
              <option value="pleadings">Pleadings</option>
              <option value="charges">Charges</option>
              <option value="evidence">Evidence</option>
              <option value="arguments">Arguments</option>
              <option value="judgment">Judgment</option>
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Court Name (Optional)</label>
          <Input name="court_name" placeholder="e.g. District Court, Pune" />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Case"}
        </Button>
      </form>
    </div>
  );
}
