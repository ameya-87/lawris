"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input, type InputProps } from "./input";
import { cn } from "@/lib/utils";

export interface PasswordInputProps extends Omit<InputProps, "type" | "rightAddon"> {
  showStrength?: boolean;
  strengthValue?: string;
}

export function scorePassword(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong"];
  return { score, label: labels[score] };
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showStrength, strengthValue, className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    const { score, label } = scorePassword(strengthValue ?? "");

    return (
      <div className="space-y-1.5">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={className}
          rightAddon={
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              tabIndex={-1}
              className="p-1.5 rounded text-stone-500 hover:text-stone-800 hover:bg-stone-100"
              aria-label={visible ? "Hide password" : "Show password"}
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          {...props}
        />
        {showStrength && strengthValue && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1 flex-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    i < score
                      ? score <= 1
                        ? "bg-red-500"
                        : score === 2
                          ? "bg-amber-500"
                          : score === 3
                            ? "bg-yellow-500"
                            : "bg-emerald-500"
                      : "bg-stone-200",
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-stone-500 w-16 text-right tabular-nums">{label}</span>
          </div>
        )}
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";
