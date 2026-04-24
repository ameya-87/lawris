"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, checked, ...props }, ref) => {
    const id = React.useId();
    return (
      <label
        htmlFor={props.id ?? id}
        className={cn(
          "inline-flex items-start gap-2.5 cursor-pointer select-none",
          className,
        )}
      >
        <span className="relative mt-0.5 inline-block">
          <input
            ref={ref}
            type="checkbox"
            id={props.id ?? id}
            checked={checked}
            className="peer sr-only"
            {...props}
          />
          <span className="block h-4 w-4 rounded border border-stone-300 bg-white peer-checked:bg-indigo-700 peer-checked:border-indigo-700 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-200 transition-colors" />
          <Check
            className={cn(
              "absolute top-[1px] left-[1px] h-3.5 w-3.5 text-white pointer-events-none transition-opacity",
              checked ? "opacity-100" : "opacity-0",
            )}
            strokeWidth={3}
          />
        </span>
        {label && <span className="text-sm text-stone-700 leading-5">{label}</span>}
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";
