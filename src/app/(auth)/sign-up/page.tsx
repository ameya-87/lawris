"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Mail, User, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { FormField } from "@/components/ui/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import { signUpSchema } from "@/lib/validation/auth";

type FieldName =
  | "full_name"
  | "email"
  | "mobile"
  | "bar_council_no"
  | "password"
  | "confirm_password"
  | "terms_accepted";

type Errors = Partial<Record<FieldName | "_form", string>>;

export default function SignUpPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    mobile: "",
    bar_council_no: "",
    password: "",
    confirm_password: "",
    terms_accepted: false,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key as FieldName]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signUpSchema.safeParse(form);
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      const next: Errors = {};
      (Object.keys(fe) as FieldName[]).forEach((k) => {
        next[k] = fe[k]?.[0];
      });
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ _form: data.error ?? "Sign up failed" });
        setSubmitting(false);
        return;
      }
      toast.success(`Welcome to Lawris, ${form.full_name.split(" ")[0]}.`);
      router.replace("/");
      router.refresh();
    } catch {
      setErrors({ _form: "Couldn't reach our servers. Try again." });
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-7">
      <header className="space-y-2">
        <h1 className="text-[28px] font-semibold tracking-tight text-stone-900 leading-tight">
          Create your Lawris account
        </h1>
        <p className="text-stone-600 text-[15px]">
          Two minutes to set up. Then your practice runs itself.
        </p>
      </header>

      {errors._form && <Alert variant="error">{errors._form}</Alert>}

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <FormField label="Full name" htmlFor="full_name" error={errors.full_name}>
          <Input
            id="full_name"
            name="full_name"
            autoComplete="name"
            placeholder="Priya Mehta"
            leftAddon={<User className="h-4 w-4" />}
            value={form.full_name}
            onChange={(e) => update("full_name", e.target.value)}
            invalid={!!errors.full_name}
          />
        </FormField>

        <FormField
          label="Email address"
          htmlFor="email"
          error={errors.email}
          helper={errors.email ? undefined : "We'll send case alerts and confirmations here."}
        >
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="priya@firm.in"
            leftAddon={<Mail className="h-4 w-4" />}
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            invalid={!!errors.email}
          />
        </FormField>

        <FormField
          label="Mobile number"
          htmlFor="mobile"
          error={errors.mobile}
        >
          <Input
            id="mobile"
            name="mobile"
            type="tel"
            autoComplete="tel-national"
            inputMode="numeric"
            placeholder="98765 43210"
            maxLength={10}
            leftAddon={
              <span className="inline-flex items-center gap-1.5">
                <span className="text-base">🇮🇳</span>
                <span className="text-stone-500">+91</span>
              </span>
            }
            value={form.mobile}
            onChange={(e) => update("mobile", e.target.value.replace(/\D/g, ""))}
            invalid={!!errors.mobile}
          />
        </FormField>

        <FormField
          label="Bar Council registration"
          htmlFor="bar_council_no"
          error={errors.bar_council_no}
          helper={
            errors.bar_council_no
              ? undefined
              : "Format: STATE/NUMBER/YEAR · We verify this against BCI records."
          }
        >
          <Input
            id="bar_council_no"
            name="bar_council_no"
            autoComplete="off"
            placeholder="MAH/12345/2018"
            leftAddon={<Hash className="h-4 w-4" />}
            value={form.bar_council_no}
            onChange={(e) => update("bar_council_no", e.target.value.toUpperCase())}
            invalid={!!errors.bar_council_no}
            className="font-mono tracking-wide"
          />
        </FormField>

        <FormField
          label="Password"
          htmlFor="password"
          error={errors.password}
          helper={errors.password ? undefined : "At least 8 characters, with a letter and a number."}
        >
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="Create a password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            invalid={!!errors.password}
            showStrength
            strengthValue={form.password}
          />
        </FormField>

        <FormField
          label="Confirm password"
          htmlFor="confirm_password"
          error={errors.confirm_password}
        >
          <PasswordInput
            id="confirm_password"
            name="confirm_password"
            autoComplete="new-password"
            placeholder="Re-enter password"
            value={form.confirm_password}
            onChange={(e) => update("confirm_password", e.target.value)}
            invalid={!!errors.confirm_password}
          />
        </FormField>

        <div className="space-y-1.5">
          <Checkbox
            label={
              <>
                I agree to the{" "}
                <Link href="/terms" className="text-indigo-700 hover:underline">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-indigo-700 hover:underline">Privacy Policy</Link>.
              </>
            }
            checked={form.terms_accepted}
            onChange={(e) => update("terms_accepted", e.currentTarget.checked)}
          />
          {errors.terms_accepted && (
            <p className="text-xs text-red-600 leading-snug">{errors.terms_accepted}</p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={submitting}
          rightIcon={!submitting && <ArrowRight className="h-4 w-4" />}
        >
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200" /></div>
        <div className="relative flex justify-center">
          <span className="bg-stone-50 px-3 text-xs text-stone-500">or</span>
        </div>
      </div>

      <p className="text-center text-sm text-stone-600">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-indigo-700 hover:text-indigo-900">
          Sign in
        </Link>
      </p>
    </div>
  );
}
