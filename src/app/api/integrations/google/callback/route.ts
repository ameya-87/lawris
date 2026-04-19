import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth/session";
import { exchangeCodeForTokens, saveTokens } from "@/lib/google/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Google OAuth callback. ALWAYS redirects to /calendar — success or failure —
 * so the client-side toast logic on the calendar page can surface the result.
 * Failure details are passed via ?google=error&message=... query params.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const err = req.nextUrl.searchParams.get("error");

  console.log("[oauth/callback] hit", {
    hasCode: !!code,
    hasState: !!state,
    error: err,
    url: req.nextUrl.pathname + req.nextUrl.search,
  });

  const destination = new URL("/calendar", req.url);
  const finish = (params: Record<string, string>) => {
    Object.entries(params).forEach(([k, v]) => destination.searchParams.set(k, v));
    // Clean up OAuth cookies on every outcome.
    try {
      const jar = cookies();
      jar.set("google_oauth_state", "", { path: "/", maxAge: 0 });
      jar.set("google_oauth_return", "", { path: "/", maxAge: 0 });
    } catch (cookieErr) {
      console.warn("[oauth/callback] cookie cleanup failed", cookieErr);
    }
    console.log("[oauth/callback] redirecting", destination.toString());
    return NextResponse.redirect(destination);
  };

  try {
    // Short-circuit: Google returned an explicit error (user denied, invalid_client, etc.)
    if (err) {
      console.error("[oauth/callback] google returned error:", err);
      return finish({ google: "error", message: err });
    }

    if (!code) {
      console.error("[oauth/callback] missing authorization code");
      return finish({ google: "error", message: "missing_code" });
    }

    // Load session AFTER the pre-checks so a Google-side error still redirects cleanly.
    const user = await getSessionUser();
    if (!user) {
      console.error("[oauth/callback] no session user — user must sign in first");
      return finish({ google: "error", message: "not_signed_in" });
    }

    // Validate CSRF state. Missing cookie == new tab / cleared session — treat as soft warning.
    const jar = cookies();
    const savedState = jar.get("google_oauth_state")?.value;
    if (!state || !savedState || savedState !== state) {
      console.warn("[oauth/callback] state mismatch", {
        hasSaved: !!savedState,
        hasReturned: !!state,
        match: savedState === state,
      });
      return finish({ google: "error", message: "state_mismatch" });
    }

    console.log("[oauth/callback] exchanging code for tokens…");
    const tokens = await exchangeCodeForTokens(code);
    console.log("[oauth/callback] token exchange OK", {
      hasAccess: !!tokens.access_token,
      hasRefresh: !!tokens.refresh_token,
      scope: tokens.scope,
      expires: tokens.expiry_date?.toISOString() ?? null,
    });

    await saveTokens(user.id, tokens);
    console.log("[oauth/callback] tokens saved for user", user.id);

    return finish({ google: "connected" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "oauth_exchange_failed";
    console.error("[oauth/callback] FATAL", message, e);
    return finish({ google: "error", message });
  }
}
