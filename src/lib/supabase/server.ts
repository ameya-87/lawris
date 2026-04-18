import { createClient } from "@supabase/supabase-js";
import { env } from "../env";

/**
 * Server-side Supabase client using the service-role key.
 * NEVER import this from a client component — leaks the service key to the browser.
 */
export function supabaseServer() {
  return createClient(env.supabaseUrl(), env.supabaseServiceKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
