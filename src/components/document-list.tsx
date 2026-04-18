"use client";

import { useState } from "react";
import type { Document } from "@/lib/types";
import { mdToHtml } from "@/lib/markdown";
import { FileText, ChevronRight } from "lucide-react";

export function DocumentList({ initial }: { initial: Document[] }) {
  const [open, setOpen] = useState<string | null>(null);

  if (initial.length === 0) {
    return (
      <div className="bg-white border border-dashed border-stone-300 rounded-lg p-8 text-center text-sm text-stone-500">
        No documents yet. Use the drafter above to generate your first one.
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200 rounded-lg divide-y divide-stone-100 overflow-hidden">
      {initial.map((d) => {
        const isOpen = open === d.id;
        return (
          <div key={d.id}>
            <button
              onClick={() => setOpen(isOpen ? null : d.id)}
              className="w-full text-left p-4 flex items-center gap-4 hover:bg-stone-50"
            >
              <FileText className="h-4 w-4 text-stone-400" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{d.name}</div>
                <div className="text-xs text-stone-500 mt-0.5 capitalize">
                  {d.doc_type.replace(/_/g, " ")} · {d.source.replace(/_/g, " ")} · {new Date(d.uploaded_at).toLocaleDateString()}
                </div>
              </div>
              <ChevronRight className={`h-4 w-4 text-stone-400 transition ${isOpen ? "rotate-90" : ""}`} />
            </button>
            {isOpen && d.content && (
              <div
                className="prose-legal px-6 pb-6 max-h-[28rem] overflow-auto"
                dangerouslySetInnerHTML={{ __html: mdToHtml(d.content) }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
