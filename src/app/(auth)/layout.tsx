import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/ui/brand-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Sparkles, Calendar, FileSearch, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Lawris — Sign in",
  description: "AI-assisted case management for Indian advocates.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background">
      {/* Left brand panel */}
      <aside className="hidden lg:flex lg:col-span-5 xl:col-span-5 relative bg-indigo-950 text-white overflow-hidden">
        {/* decorative glow */}
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-indigo-800/40 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.06),transparent_60%)]" />

        <div className="relative z-10 flex flex-col w-full p-12 xl:p-14">
          <BrandMark tone="light" size="md" />

          <div className="flex-1 flex flex-col justify-center max-w-md">
            <div className="text-xs uppercase tracking-[0.2em] text-indigo-300 mb-5">
              A new operating system for Indian advocates
            </div>
            <h1 className="text-4xl xl:text-5xl font-semibold tracking-tight leading-[1.08] text-balance">
              Never miss a chargesheet deadline&nbsp;again.
            </h1>
            <p className="mt-5 text-indigo-200 leading-relaxed text-[15px]">
              Lawris tracks every statutory clock, drafts court-ready pleadings from your
              case facts in under 30 seconds, and answers legal research grounded in your
              own files.
            </p>

            <ul className="mt-10 space-y-4">
              <Feature
                icon={<Calendar className="h-4 w-4" />}
                title="Deadline brain"
                body="BNSS s.187(3), Limitation Act, hearing schedules — auto-computed."
              />
              <Feature
                icon={<Sparkles className="h-4 w-4" />}
                title="AI document drafter"
                body="Bail applications, plaints, written statements — in court format."
              />
              <Feature
                icon={<FileSearch className="h-4 w-4" />}
                title="Case-aware research"
                body="Upload FIRs and orders. Answers cite your files, not Wikipedia."
              />
            </ul>
          </div>

          <div className="flex items-center gap-3 text-xs text-indigo-300/80">
            <Shield className="h-3.5 w-3.5" />
            Bank-grade encryption · Data stays in India · Bar Council verified
          </div>
        </div>
      </aside>

      {/* Right form panel */}
      <main className="lg:col-span-7 xl:col-span-7 flex flex-col">
        {/* mobile brand strip */}
        <div className="lg:hidden flex items-center justify-between px-6 h-14 border-b border-stone-200 dark:border-stone-800 bg-surface">
          <BrandMark tone="dark" size="sm" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/landing"
              className="text-xs text-stone-500 dark:text-stone-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              Help
            </Link>
          </div>
        </div>

        {/* desktop theme toggle (top-right of right panel) */}
        <div className="hidden lg:flex justify-end px-10 pt-6">
          <ThemeToggle />
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-[440px]">{children}</div>
        </div>

        <footer className="px-6 sm:px-10 py-4 text-xs text-stone-400 dark:text-stone-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Lawris · For Indian advocates</span>
          <span className="hidden sm:block">Terms · Privacy</span>
        </footer>
      </main>

    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/30">
        {icon}
      </span>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-[13px] text-indigo-200/80 leading-relaxed">{body}</div>
      </div>
    </li>
  );
}
