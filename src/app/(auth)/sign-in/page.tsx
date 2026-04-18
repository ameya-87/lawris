"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { FormField } from "@/components/ui/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import { signInSchema } from "@/lib/validation/auth";

type Errors = Partial<Record<"identifier" | "password" | "_form", string>>;

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("next") ?? "/";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signInSchema.safeParse({ identifier, password, remember });
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      setErrors({
        identifier: fe.identifier?.[0],
        password: fe.password?.[0],
      });
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ _form: data.error ?? "Sign in failed" });
        setSubmitting(false);
        return;
      }
      toast.success(`Welcome back${data.user?.full_name ? `, ${data.user.full_name.split(" ")[0]}` : ""}.`);
      router.replace(redirectTo);
      router.refresh();
    } catch {
      setErrors({ _form: "Couldn't reach our servers. Try again." });
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-[28px] font-semibold tracking-tight text-stone-900 leading-tight">
          Welcome back
        </h1>
        <p className="text-stone-600 text-[15px]">
          Sign in to your Lawris account to continue.
        </p>
      </header>

      {errors._form && <Alert variant="error">{errors._form}</Alert>}

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <FormField
          label="Email or Bar Council number"
          htmlFor="identifier"
          error={errors.identifier}
          helper={errors.identifier ? undefined : "e.g. name@firm.in or MAH/12345/2018"}
        >
          <Input
            id="identifier"
            name="identifier"
            autoComplete="username"
            autoFocus
            placeholder="advocate@firm.in"
            leftAddon={<Mail className="h-4 w-4" />}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            invalid={!!errors.identifier}
          />
        </FormField>

        <FormField
          label="Password"
          htmlFor="password"
          error={errors.password}
          rightSlot={
            <span className="text-xs text-stone-400 cursor-not-allowed" title="Coming soon">
              Forgot password?
            </span>
          }
        >
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            invalid={!!errors.password}
          />
        </FormField>

        <Checkbox
          label="Remember me on this device"
          checked={remember}
          onChange={(e) => setRemember(e.currentTarget.checked)}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={submitting}
          rightIcon={!submitting && <ArrowRight className="h-4 w-4" />}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200" /></div>
        <div className="relative flex justify-center">
          <span className="bg-stone-50 px-3 text-xs text-stone-500">or</span>
        </div>
      </div>

      <p className="text-center text-sm text-stone-600">
        New to Lawris?{" "}
        <Link href="/sign-up" className="font-medium text-indigo-700 hover:text-indigo-900">
          Create an account
        </Link>
      </p>
    </div>
  );
}
