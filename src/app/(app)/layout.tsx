import Link from "next/link";
import { Calendar, FolderOpen, Home } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";
import { UserMenu } from "@/components/user-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getSessionUser } from "@/lib/auth/session";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-stone-200 dark:border-stone-800 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-8">
          <Link href="/" className="flex items-center">
            <BrandMark size="md" />
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <NavLink href="/" icon={<Home className="h-3.5 w-3.5" />}>Dashboard</NavLink>
            <NavLink href="/cases" icon={<FolderOpen className="h-3.5 w-3.5" />}>Cases</NavLink>
            <NavLink href="/calendar" icon={<Calendar className="h-3.5 w-3.5" />}>Calendar</NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            {user && <NotificationBell />}
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
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100/70 dark:hover:bg-stone-800/60 transition"
    >
      {icon}
      {children}
    </Link>
  );
}
