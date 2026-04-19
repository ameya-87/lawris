import { NextResponse } from "next/server";
import { supabaseRequestClient } from "@/lib/supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const sb = supabaseRequestClient();
  await sb.auth.signOut();
  return NextResponse.json({ ok: true });
}
