import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/ui/brand-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export const metadata: Metadata = {
  title: "Lawris — AI Legal Workflow Assistant",
  description:
    "Case management, AI drafting, and case-grounded legal research, built for Indian advocates.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-30 border-b border-stone-200 dark:border-stone-800 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-6">
          <Link href="/landing" className="flex items-center">
            <BrandMark size="md" />
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-stone-600 dark:text-stone-300">
            <Link href="#features" className="hover:text-stone-900 dark:hover:text-white transition">
              Features
            </Link>
            <Link href="#how" className="hover:text-stone-900 dark:hover:text-white transition">
              How it works
            </Link>
            <Link href="#trust" className="hover:text-stone-900 dark:hover:text-white transition">
              Trust
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/sign-in"
              className="text-sm font-medium text-stone-700 dark:text-stone-200 hover:text-indigo-700 dark:hover:text-indigo-300 transition px-3 py-1.5 rounded-md"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 rounded-md px-3 py-1.5 transition"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-stone-200 dark:border-stone-800 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-500">
          <div className="flex items-center gap-2">
            <BrandMark size="sm" />
            <span>© {new Date().getFullYear()} Lawris. For Indian advocates.</span>
          </div>
          <div className="flex items-center gap-5">
            <span>Not legal advice</span>
            <span>Data stays in India</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
