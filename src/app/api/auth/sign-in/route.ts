import { NextRequest, NextResponse } from "next/server";
import { supabaseRequestClient } from "@/lib/supabase/ssr";
import { supabaseServer } from "@/lib/supabase/server";
import { BAR_COUNCIL_REGEX, signInSchema } from "@/lib/validation/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = signInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const { identifier, password } = parsed.data;

  // Identifier may be an email OR a Bar Council number. If the latter, look up
  // the email on the profile table first.
  let email = identifier;
  if (BAR_COUNCIL_REGEX.test(identifier)) {
    const admin = supabaseServer();
    const { data, error } = await admin
      .from("users")
      .select("email")
      .eq("bar_council_no", identifier.toUpperCase())
      .maybeSingle();
    if (error || !data) {
      return NextResponse.json(
        { error: "No account found for that Bar Council number." },
        { status: 404 },
      );
    }
    email = data.email;
  }

  const sbReq = supabaseRequestClient();
  const { data, error } = await sbReq.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return NextResponse.json(
      { error: "Email, Bar Council number, or password is incorrect." },
      { status: 401 },
    );
  }

  // Fetch the profile for the welcome message.
  const admin = supabaseServer();
  const { data: profile } = await admin
    .from("users")
    .select("full_name")
    .eq("id", data.user.id)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    user: { id: data.user.id, email: data.user.email, full_name: profile?.full_name ?? null },
  });
}
