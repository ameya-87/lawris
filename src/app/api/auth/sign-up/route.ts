import { NextRequest, NextResponse } from "next/server";
import { supabaseRequestClient } from "@/lib/supabase/ssr";
import { supabaseServer } from "@/lib/supabase/server";
import { signUpSchema } from "@/lib/validation/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = signUpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const { full_name, email, mobile, bar_council_no, password } = parsed.data;

  const admin = supabaseServer();

  // Reject duplicate bar council numbers early (friendlier error than Supabase's).
  const existing = await admin
    .from("users")
    .select("id")
    .eq("bar_council_no", bar_council_no)
    .maybeSingle();
  if (existing.data) {
    return NextResponse.json(
      { error: "An account with that Bar Council number already exists. Try signing in instead." },
      { status: 409 },
    );
  }

  // Create the auth user via service-role. `email_confirm: true` skips verification
  // for the hackathon demo; production should flip this off and add a verify flow.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, bar_council_no },
  });
  if (createErr || !created?.user) {
    const msg = createErr?.message ?? "Could not create account";
    const dup = msg.toLowerCase().includes("already") || msg.toLowerCase().includes("registered");
    return NextResponse.json(
      {
        error: dup
          ? "An account with that email already exists. Sign in instead."
          : msg,
      },
      { status: dup ? 409 : 500 },
    );
  }

  // Create the profile row. The primary key matches auth.users.id so every
  // query keyed on lawyer_id works transparently post-signup.
  const { error: profileErr } = await admin.from("users").insert({
    id: created.user.id,
    email,
    full_name,
    bar_council_no,
    phone: `+91${mobile}`,
  });
  if (profileErr) {
    // Roll back the auth user so the account isn't half-created.
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  // Sign the new user in immediately so the response sets the session cookie.
  const sbReq = supabaseRequestClient();
  const { error: signInErr } = await sbReq.auth.signInWithPassword({ email, password });
  if (signInErr) {
    return NextResponse.json(
      { error: "Account created but sign-in failed. Please sign in manually." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, user: { id: created.user.id, full_name, email } });
}
