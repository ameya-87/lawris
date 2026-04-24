import { cn } from "@/lib/utils";

/**
 * Thin shimmering placeholder driven by the `.skeleton` utility in globals.css.
 * Default height/width can be overridden via className.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton rounded-md h-4 w-full", className)}
      aria-hidden
      {...props}
    />
  );
}
