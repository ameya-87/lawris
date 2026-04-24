import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = supabaseServer();
  const { error } = await sb
    .from("notifications")
    .update({
      status: "read",
      read_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("status", "unread");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
