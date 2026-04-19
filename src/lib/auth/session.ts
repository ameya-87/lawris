import { supabaseRequestClient } from "@/lib/supabase/ssr";
import { supabaseServer } from "@/lib/supabase/server";

export interface SessionUser {
  id: string;
  email: string;
  full_name: string;
  bar_council_no: string | null;
}

/**
 * Resolve the current lawyer (user) for the request.
 *
 * Priority:
 *   1. Supabase Auth session cookie → look up users row by id.
 *   2. LAWYER_ID env var fallback (demo mode). Useful while the feature is
 *      being wired and for the seeded demo account.
 *
 * Returns null if nobody is authenticated AND no fallback is configured.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  // 1. Supabase Auth cookie
  const sbReq = supabaseRequestClient();
  const { data: authData } = await sbReq.auth.getUser();

  if (authData?.user) {
    const id = authData.user.id;
    const admin = supabaseServer();
    const { data: profile } = await admin
      .from("users")
      .select("id, email, full_name, bar_council_no")
      .eq("id", id)
      .maybeSingle();
    if (profile) return profile as SessionUser;
    // Auth user exists but profile row missing — shouldn't happen in practice.
    return {
      id,
      email: authData.user.email ?? "",
      full_name: authData.user.email?.split("@")[0] ?? "Advocate",
      bar_council_no: null,
    };
  }

  // 2. Fallback: env-pinned demo user (useful during development / seeded demo)
  const fallbackId = process.env.LAWYER_ID;
  if (!fallbackId) return null;

  const admin = supabaseServer();
  const { data: profile } = await admin
    .from("users")
    .select("id, email, full_name, bar_council_no")
    .eq("id", fallbackId)
    .maybeSingle();
  return (profile as SessionUser | null) ?? null;
}

/**
 * Returns the current lawyer's UUID. Middleware guarantees either a session or
 * the LAWYER_ID fallback is in scope by the time a protected route runs, so
 * callers can treat this as always-valid. Throws if neither is available.
 */
export async function getLawyerId(): Promise<string> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}
