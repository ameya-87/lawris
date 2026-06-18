import Link from "next/link";
import { Calendar, FolderOpen, Home } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";
import { UserMenu } from "@/components/user-menu";
import { getSessionUser } from "@/lib/auth/session";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-8">
          <Link href="/" className="flex items-center">
            <BrandMark size="md" />
          </Link>
          <nav className="flex items-center gap-5 text-sm text-stone-600">
            <NavLink href="/" icon={<Home className="h-3.5 w-3.5" />}>Dashboard</NavLink>
            <NavLink href="/cases" icon={<FolderOpen className="h-3.5 w-3.5" />}>Cases</NavLink>
            <NavLink href="/calendar" icon={<Calendar className="h-3.5 w-3.5" />}>Calendar</NavLink>
          </nav>
          <div className="ml-auto">
            <UserMenu
              user={
                user
                  ? {
                      name: user.full_name,
                      email: user.email,
                      barCouncilNo: user.bar_council_no,
                    }
                  : null
              }
            />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 hover:text-indigo-700 transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}
