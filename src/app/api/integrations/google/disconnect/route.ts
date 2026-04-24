import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { deleteTokens } from "@/lib/google/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await deleteTokens(user.id);
  return NextResponse.json({ ok: true });
}
