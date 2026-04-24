import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  FileSearch,
  FolderOpen,
  Scale,
  ShieldCheck,
  Sparkles,
  Upload,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function LandingPage() {
  return (
    <>
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <GradientGlow />
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 relative">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 rounded-full px-3 py-1 animate-fade-in-fast">
              <Sparkles className="h-3 w-3" />
              Built for BNSS, BNS, BSA & CPC
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05] text-balance text-stone-900 dark:text-stone-50 animate-fade-in">
              AI Legal Workflow
              <br />
              <span className="text-indigo-700 dark:text-indigo-400">
                Assistant for Indian Lawyers.
              </span>
            </h1>
            <p className="mt-5 text-lg text-stone-600 dark:text-stone-300 leading-relaxed max-w-2xl">
              Track every chargesheet deadline, draft court-ready pleadings from case facts
              in seconds, and get legal research grounded in your own files — never generic.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white text-sm font-medium rounded-md px-5 py-2.5 shadow-soft transition"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 text-sm font-medium text-stone-800 dark:text-stone-100 border border-stone-300 dark:border-stone-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-surface rounded-md px-5 py-2.5 transition"
              >
                View Demo
              </Link>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>No credit card required · Free for hackathon demo</span>
            </div>
          </div>

          {/* Mock dashboard preview */}
          <div className="mt-16">
            <DashboardMock />
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="max-w-2xl">
          <h2 className="text-xs uppercase tracking-wider text-indigo-700 dark:text-indigo-400 font-semibold">
            What you get
          </h2>
          <p className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
            An operating system for case work.
          </p>
          <p className="mt-3 text-stone-600 dark:text-stone-300">
            Four connected surfaces that replace the spreadsheets, calendars, and notepads
            you juggle today.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard
            icon={<FolderOpen className="h-5 w-5" />}
            title="Case Management"
            body="One file per matter: parties, court, FIR, documents, hearings — never lose context."
          />
          <FeatureCard
            icon={<Sparkles className="h-5 w-5" />}
            title="AI Drafting"
            body="Bail applications, plaints, and written statements in court format, in under 30 seconds."
          />
          <FeatureCard
            icon={<Calendar className="h-5 w-5" />}
            title="Deadline Tracking"
            body="BNSS §187(3), Limitation Act, hearing schedules — auto-computed and synced to Google Calendar."
          />
          <FeatureCard
            icon={<FileSearch className="h-5 w-5" />}
            title="Legal Research"
            body="Answers grounded in your case files and a curated Indian law corpus. Cites the statute, not the model."
          />
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────── */}
      <section
        id="how"
        className="border-y border-stone-200 dark:border-stone-800 bg-surface-muted"
      >
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-2xl">
            <h2 className="text-xs uppercase tracking-wider text-indigo-700 dark:text-indigo-400 font-semibold">
              How it works
            </h2>
            <p className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
              From FIR to filing in three steps.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            <StepCard
              n="01"
              icon={<Upload className="h-5 w-5" />}
              title="Upload case"
              body="Enter case facts, upload FIRs or orders. Lawris indexes the text privately in India."
            />
            <StepCard
              n="02"
              icon={<Sparkles className="h-5 w-5" />}
              title="AI processes"
              body="Statutory deadlines are computed from dates. Hearings are extracted. Citations are retrieved."
            />
            <StepCard
              n="03"
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="Get insights + actions"
              body="See the next filing, the next hearing, the next deadline. Draft or sync with one click."
            />
          </div>
        </div>
      </section>

      {/* ── Trust ──────────────────────────────────────────── */}
      <section id="trust" className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TrustCard
            icon={<Scale className="h-5 w-5" />}
            title="Built for Indian legal workflows"
            body="BNSS, BNS, BSA, CPC, POCSO, Limitation Act — our prompts and deadline engines are tuned for Indian practice, not translated American templates."
          />
          <TrustCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Not legal advice"
            body="Lawris surfaces drafts and research to support your judgment. Every output should be reviewed by the advocate of record before filing or relying on it in court."
          />
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="relative overflow-hidden bg-stone-900 dark:bg-stone-950 rounded-3xl px-8 py-14 text-center shadow-lift">
          <div className="absolute -top-28 -left-28 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />
          <div className="absolute -bottom-28 -right-28 h-72 w-72 rounded-full bg-indigo-700/30 blur-3xl" />
          <h2 className="relative text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            Start using Lawris.
          </h2>
          <p className="relative mt-3 text-stone-300 max-w-xl mx-auto">
            Create a workspace in under a minute. Your first three cases are on us.
          </p>
          <div className="relative mt-8 flex items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 bg-white hover:bg-stone-100 text-stone-900 text-sm font-semibold rounded-md px-5 py-2.5 transition"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 text-sm font-medium text-stone-200 hover:text-white rounded-md px-5 py-2.5 transition border border-white/10 hover:border-white/30"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Sub-components ─────────────────────────────────────────

function GradientGlow() {
  return (
    <>
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[30rem] w-[60rem] rounded-full bg-indigo-300/40 dark:bg-indigo-500/20 blur-3xl pointer-events-none" />
      <div className="absolute top-40 right-[-10rem] h-[20rem] w-[20rem] rounded-full bg-amber-200/40 dark:bg-amber-500/10 blur-3xl pointer-events-none" />
    </>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="group relative bg-surface border border-stone-200 dark:border-stone-800 rounded-2xl p-5 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lift transition">
      <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold text-stone-900 dark:text-stone-50">
        {title}
      </h3>
      <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
        {body}
      </p>
    </div>
  );
}

function StepCard({
  n,
  icon,
  title,
  body,
}: {
  n: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-surface border border-stone-200 dark:border-stone-800 rounded-2xl p-6">
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-stone-400 dark:text-stone-500 tabular-nums">{n}</span>
        <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <h3 className="mt-4 text-base font-semibold text-stone-900 dark:text-stone-50">{title}</h3>
      <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-300 leading-relaxed">{body}</p>
    </div>
  );
}

function TrustCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-surface border border-stone-200 dark:border-stone-800 rounded-2xl p-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-base font-semibold text-stone-900 dark:text-stone-50">{title}</h3>
      </div>
      <p className="mt-3 text-sm text-stone-600 dark:text-stone-300 leading-relaxed">{body}</p>
    </div>
  );
}

function DashboardMock() {
  return (
    <div className="relative mx-auto max-w-5xl">
      <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-surface shadow-lift overflow-hidden">
        {/* fake top bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-stone-200 dark:border-stone-800 bg-surface-muted">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <div className="ml-4 text-[11px] text-stone-400 font-mono">lawris.in/dashboard</div>
        </div>
        {/* body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <MockTile tone="red" label="Critical" value="2" sub="due within 3 days" />
          <MockTile tone="amber" label="Due this week" value="5" sub="hearings + filings" />
          <MockTile tone="muted" label="Active matters" value="18" sub="across 3 courts" />
        </div>
        <div className="px-6 pb-6">
          <div className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
            Next actions
          </div>
          <ul className="space-y-2">
            <MockAction tone="red" title="File bail response by 21 Apr" sub="State v. R. Sharma" />
            <MockAction tone="amber" title="Draft rejoinder for POCSO matter" sub="Due tomorrow" />
            <MockAction tone="blue" title="Upload affidavit of service" sub="Pending client signature" />
          </ul>
        </div>
      </div>
    </div>
  );
}

function MockTile({
  tone,
  label,
  value,
  sub,
}: {
  tone: "red" | "amber" | "muted";
  label: string;
  value: string;
  sub: string;
}) {
  const tones = {
    red: "border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200",
    amber:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200",
    muted:
      "border-stone-200 bg-surface text-stone-900 dark:border-stone-800 dark:text-stone-50",
  }[tone];
  return (
    <div className={`border rounded-xl p-4 ${tones}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-80">{label}</div>
      <div className="text-3xl font-semibold mt-1 tabular-nums">{value}</div>
      <div className="text-[11px] opacity-70 mt-0.5">{sub}</div>
    </div>
  );
}

function MockAction({
  tone,
  title,
  sub,
}: {
  tone: "red" | "amber" | "blue";
  title: string;
  sub: string;
}) {
  const dot = {
    red: "bg-red-500",
    amber: "bg-amber-500",
    blue: "bg-indigo-500",
  }[tone];
  return (
    <li className="flex items-start gap-3 p-3 border border-stone-200 dark:border-stone-800 rounded-xl bg-surface-muted">
      <span className={`mt-1.5 h-2 w-2 rounded-full ${dot}`} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-stone-900 dark:text-stone-50">{title}</div>
        <div className="text-[11px] text-stone-500 dark:text-stone-400">{sub}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-stone-300 dark:text-stone-600" />
    </li>
  );
}
