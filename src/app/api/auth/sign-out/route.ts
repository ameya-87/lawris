import { NextResponse } from "next/server";
import { supabaseRequestClient } from "@/lib/supabase/ssr";

export async function POST() {
  const supabase = supabaseRequestClient();
  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
}
