import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const checks = {
    ok: true,
    env: {
      gemini: Boolean(process.env.GEMINI_API_KEY),
      supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      supabaseServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      lawyerId: Boolean(process.env.LAWYER_ID),
    },
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(checks);
}
