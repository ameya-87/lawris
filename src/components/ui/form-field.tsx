"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  helper?: string;
  optional?: boolean;
  rightSlot?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  htmlFor,
  error,
  helper,
  optional,
  rightSlot,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <label htmlFor={htmlFor} className="text-sm font-medium text-stone-800">
          {label}
          {optional && <span className="ml-1.5 text-xs font-normal text-stone-400">Optional</span>}
        </label>
        {rightSlot}
      </div>
      {children}
      {error ? (
        <p className="text-xs text-red-600 leading-snug">{error}</p>
      ) : helper ? (
        <p className="text-xs text-stone-500 leading-snug">{helper}</p>
      ) : null}
    </div>
  );
}
