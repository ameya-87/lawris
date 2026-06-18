import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Route protection for (app) pages.
 * Reads the Supabase auth cookie and redirects unauthenticated requests to /sign-in.
 *
 * Fallback: if LAWYER_ID is set AND SKIP_AUTH_IN_DEV is true, we let requests through
 * so the seeded demo continues to work while migrating off the env-pinned user.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public paths — never gate.
  const isPublicAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/fonts") ||
    pathname === "/robots.txt";
  const isAuthPage = pathname === "/sign-in" || pathname === "/sign-up";
  const isAuthApi = pathname.startsWith("/api/auth");
  const isHealthCheck = pathname === "/api/health";

  if (isPublicAsset || isAuthApi || isHealthCheck) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          res.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  const authed = !!data?.user;

  // Signed-in users shouldn't see auth pages; bounce them home.
  if (authed && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Unsigned users can see auth pages.
  if (isAuthPage) return res;

  // Everything else requires auth — unless the demo fallback is engaged.
  const fallbackActive =
    process.env.LAWYER_ID && process.env.SKIP_AUTH_IN_DEV === "1";

  if (!authed && !fallbackActive) {
    const url = new URL("/sign-in", req.url);
    // Preserve where the user was heading so we can send them back after sign-in.
    if (pathname !== "/") url.searchParams.set("next", pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  // Run middleware on everything except static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
