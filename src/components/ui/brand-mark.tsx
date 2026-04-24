import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "dark" | "light";
  showWord?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: "h-4 w-4", text: "text-base" },
  md: { icon: "h-5 w-5", text: "text-xl" },
  lg: { icon: "h-6 w-6", text: "text-2xl" },
  xl: { icon: "h-8 w-8", text: "text-4xl" },
};

export function BrandMark({
  size = "md",
  tone = "dark",
  showWord = true,
  className,
}: BrandMarkProps) {
  const s = sizes[size];
  const colors =
    tone === "dark"
      ? { icon: "text-indigo-700 dark:text-indigo-400", text: "text-stone-900 dark:text-stone-50" }
      : { icon: "text-indigo-300", text: "text-white" };
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <Scale className={cn(s.icon, colors.icon)} strokeWidth={2.25} />
      {showWord && <span className={cn(s.text, colors.text)}>Lawris</span>}
    </span>
  );
}
