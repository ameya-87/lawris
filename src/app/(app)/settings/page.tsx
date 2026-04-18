import { redirect } from "next/navigation";
import { Mail, Phone, Hash, User as UserIcon } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { SignOutButton } from "@/components/sign-out-button";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-stone-600 mt-0.5">Your account and profile information.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>This is how Lawris identifies you across the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Row icon={<UserIcon className="h-4 w-4" />} label="Full name" value={user.full_name} />
          <Row icon={<Mail className="h-4 w-4" />} label="Email" value={user.email} />
          <Row
            icon={<Hash className="h-4 w-4" />}
            label="Bar Council registration"
            value={user.bar_council_no ?? "—"}
            mono
          />
          <Row
            icon={<Phone className="h-4 w-4" />}
            label="Mobile"
            value={"—"}
            helper="Mobile updates coming soon"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
          <CardDescription>Sign out of this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignOutButton />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  mono,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  helper?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-stone-100 text-stone-600">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs uppercase tracking-wide text-stone-500">{label}</div>
        <div className={`text-sm text-stone-900 mt-0.5 ${mono ? "font-mono" : ""}`}>{value}</div>
        {helper && <div className="text-xs text-stone-400 mt-0.5">{helper}</div>}
      </div>
    </div>
  );
}
