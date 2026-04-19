"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileDown, Loader2 } from "lucide-react";

interface Props {
  caseId: string;
  className?: string;
}

export function ExportReportButton({ caseId, className = "" }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    const pending = toast.loading("Compiling case intelligence report…", {
      description: "Generating AI summary and building DOCX",
    });
    try {
      const res = await fetch(`/api/cases/${caseId}/report`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Export failed (${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const cd = res.headers.get("Content-Disposition") ?? "";
      const match = cd.match(/filename="([^"]+)"/);
      a.download = match ? match[1] : "Lawris_Report.docx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("Report downloaded", { id: pending });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Export failed";
      toast.error(message, { id: pending });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 text-sm font-medium rounded-md px-3.5 py-2 transition shadow-soft disabled:opacity-60 disabled:cursor-not-allowed bg-stone-900 hover:bg-stone-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white ${className}`}
      title="Generate a DOCX case intelligence report"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      {loading ? "Generating…" : "Export Report"}
    </button>
  );
}
