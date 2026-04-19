import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getConnectionStatus } from "@/lib/google/oauth";
import { isGoogleConfigured } from "@/lib/google/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const status = await getConnectionStatus(user.id);
  return NextResponse.json({ ...status, configured: isGoogleConfigured() });
}
