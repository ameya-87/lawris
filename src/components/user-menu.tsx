"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface Props {
  user: { name: string; email: string; barCouncilNo: string | null } | null;
}

export function UserMenu({ user }: Props) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) {
    return (
      <Link
        href="/sign-in"
        className="text-sm font-medium text-indigo-700 hover:text-indigo-900"
      >
        Sign in
      </Link>
    );
  }

  const initials = user.name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function signOut() {
    setSigningOut(true);
    try {
      const res = await fetch("/api/auth/sign-out", { method: "POST" });
      if (!res.ok) throw new Error("Sign out failed");
      toast.success("Signed out");
      router.push("/sign-in");
      router.refresh();
    } catch {
      toast.error("Could not sign out. Try again.");
      setSigningOut(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 py-1 pl-1 pr-2 rounded-md hover:bg-stone-100 transition"
        aria-expanded={open}
      >
        <span className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-800 text-white text-xs font-semibold flex items-center justify-center">
          {initials}
        </span>
        <span className="text-sm font-medium text-stone-900 hidden sm:inline">{user.name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-stone-500" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-stone-200 rounded-lg shadow-lg overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-stone-100">
            <div className="text-sm font-medium text-stone-900 truncate">{user.name}</div>
            <div className="text-xs text-stone-500 truncate">{user.email}</div>
            {user.barCouncilNo && (
              <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-mono">
                {user.barCouncilNo}
              </div>
            )}
          </div>
          <div className="p-1">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-stone-700 hover:bg-stone-50"
            >
              <Settings className="h-4 w-4 text-stone-500" />
              Settings
            </Link>
            <button
              onClick={signOut}
              disabled={signingOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4 text-stone-500" />
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
