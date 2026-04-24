import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function PUT(_req: Request, { params }: { params: { id: string } }) {
  const sb = supabaseServer();
  const { error } = await sb.from("deadlines").update({ is_completed: true }).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
