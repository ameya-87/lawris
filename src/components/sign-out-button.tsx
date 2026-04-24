"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/sign-out", { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success("Signed out");
      router.push("/sign-in");
      router.refresh();
    } catch {
      toast.error("Could not sign out. Try again.");
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" leftIcon={<LogOut className="h-4 w-4" />} onClick={signOut} loading={loading}>
      Sign out
    </Button>
  );
}
