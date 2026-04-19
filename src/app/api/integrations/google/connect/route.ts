import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { getSessionUser } from "@/lib/auth/session";
import { buildAuthUrl } from "@/lib/google/oauth";
import { isGoogleConfigured } from "@/lib/google/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Starts the Google OAuth flow. The callback will ALWAYS redirect to
 * /calendar, so this route's only job is to (1) validate config, (2) set
 * CSRF state + return_to cookies, (3) redirect to Google.
 *
 * On error we redirect to /calendar with ?google=error so the UI can
 * surface the problem via toast instead of leaving the user on a 500.
 */
export async function GET(req: NextRequest) {
  console.log("[oauth/connect] hit");

  const user = await getSessionUser();
  if (!user) {
    console.warn("[oauth/connect] no session — sending to /sign-in");
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
  if (!isGoogleConfigured()) {
    console.error("[oauth/connect] Google OAuth env vars not configured");
    const url = new URL("/calendar", req.url);
    url.searchParams.set("google", "error");
    url.searchParams.set("message", "not_configured");
    return NextResponse.redirect(url);
  }

  try {
    const state = randomBytes(16).toString("hex");
    const returnTo = req.nextUrl.searchParams.get("return_to") ?? "/calendar";

    const jar = cookies();
    jar.set("google_oauth_state", state, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 600,
    });
    jar.set("google_oauth_return", returnTo, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 600,
    });

    const authUrl = buildAuthUrl(state);
    console.log("[oauth/connect] redirecting to Google", {
      userId: user.id,
      returnTo,
      state: state.slice(0, 8) + "…",
    });
    return NextResponse.redirect(authUrl);
  } catch (e) {
    const message = e instanceof Error ? e.message : "oauth_start_failed";
    console.error("[oauth/connect] FATAL", message, e);
    const url = new URL("/calendar", req.url);
    url.searchParams.set("google", "error");
    url.searchParams.set("message", message);
    return NextResponse.redirect(url);
  }
}
