import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client bound to the current request's cookies.
 * Use inside server components, route handlers, and server actions.
 * Automatically reads/writes the Supabase auth cookie.
 */
export function supabaseRequestClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Server component — cookies are read-only here; writes happen in route handlers.
          }
        },
        remove: (name, options) => {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            /* noop */
          }
        },
      },
    },
  );
}
