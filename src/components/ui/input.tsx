"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, leftAddon, rightAddon, ...props }, ref) => {
    const baseInput =
      "flex-1 bg-transparent text-[15px] text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 outline-none min-w-0";
    const wrap =
      "flex items-stretch h-11 rounded-md border bg-surface transition-colors overflow-hidden focus-within:ring-2 focus-within:ring-offset-0";
    const borderState = invalid
      ? "border-red-400 dark:border-red-500 focus-within:ring-red-200 dark:focus-within:ring-red-900/50 focus-within:border-red-500"
      : "border-stone-300 dark:border-stone-700 focus-within:ring-indigo-200 dark:focus-within:ring-indigo-900/50 focus-within:border-indigo-500";

    return (
      <div className={cn(wrap, borderState, className)}>
        {leftAddon && (
          <div className="flex items-center px-3 bg-surface-muted border-r border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-sm">
            {leftAddon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(baseInput, leftAddon ? "pl-3" : "pl-3.5", rightAddon ? "pr-2" : "pr-3.5")}
          {...props}
        />
        {rightAddon && <div className="flex items-center pr-2">{rightAddon}</div>}
      </div>
    );
  },
);
Input.displayName = "Input";
