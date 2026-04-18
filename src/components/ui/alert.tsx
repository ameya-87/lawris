"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "error" | "success" | "info" | "warning";

const variants: Record<Variant, { bg: string; border: string; text: string; Icon: React.ComponentType<{ className?: string }> }> = {
  error:   { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-900",     Icon: AlertCircle },
  success: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900", Icon: CheckCircle2 },
  info:    { bg: "bg-indigo-50",  border: "border-indigo-200",  text: "text-indigo-900",  Icon: Info },
  warning: { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-900",   Icon: AlertTriangle },
};

interface AlertProps {
  variant?: Variant;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

export function Alert({ variant = "info", title, children, className }: AlertProps) {
  const v = variants[variant];
  return (
    <div className={cn("flex items-start gap-2.5 rounded-md border p-3 text-sm", v.bg, v.border, v.text, className)}>
      <v.Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        {title && <div className="font-medium leading-tight mb-0.5">{title}</div>}
        {children && <div className="leading-snug">{children}</div>}
      </div>
    </div>
  );
}
