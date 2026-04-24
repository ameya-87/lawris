import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  cta?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, body, cta, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "bg-white border border-dashed border-stone-300 rounded-lg p-10 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-500">
          {icon}
        </div>
      )}
      <div className="font-medium text-stone-900">{title}</div>
      {body && <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto leading-relaxed">{body}</p>}
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}
