import { cn } from "@/lib/utils";

/**
 * Unified status/urgency colour system.
 *
 * Mapping (per the product spec):
 *   red    → critical / urgent / overdue
 *   amber  → due soon / warning
 *   green  → completed / safe / synced
 *   blue   → active / synced / info
 *   grey   → inactive / neutral
 */
export type StatusTone = "red" | "amber" | "green" | "blue" | "grey";

const TONE: Record<StatusTone, string> = {
  red: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-200 dark:border-red-900/80",
  amber:
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-900/80",
  green:
    "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-900/80",
  blue: "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-200 dark:border-indigo-900/80",
  grey: "bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800/60 dark:text-stone-300 dark:border-stone-700",
};

interface Props {
  tone: StatusTone;
  children: React.ReactNode;
  icon?: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({ tone, children, icon, size = "sm", className }: Props) {
  const padding = size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11px]";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border rounded-full font-medium tracking-tight",
        TONE[tone],
        padding,
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Maps the existing Urgency enum to a StatusTone. */
export function urgencyToTone(urgency: "critical" | "high" | "medium" | "low"): StatusTone {
  switch (urgency) {
    case "critical":
      return "red";
    case "high":
      return "amber";
    case "medium":
      return "amber";
    case "low":
      return "grey";
  }
}
