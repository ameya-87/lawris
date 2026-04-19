import { supabaseServer } from "@/lib/supabase/server";
import {
  GOOGLE_AUTH_URL,
  GOOGLE_SCOPES,
  GOOGLE_TOKEN_URL,
  googleConfig,
} from "./config";

export interface GoogleTokens {
  access_token: string;
  refresh_token: string | null;
  expiry_date: Date | null;
  scope: string | null;
  token_type: string;
}

export function buildAuthUrl(state: string): string {
  const { clientId, redirectUri } = googleConfig();
  if (!clientId || !redirectUri) {
    throw new Error("Google OAuth not configured (GOOGLE_CLIENT_ID / GOOGLE_OAUTH_REDIRECT_URI missing)");
  }
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const { clientId, clientSecret, redirectUri } = googleConfig();
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Google OAuth not configured");
  }
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error_description ?? data?.error ?? `Token exchange failed (${res.status})`);
  }
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? null,
    expiry_date: data.expires_in
      ? new Date(Date.now() + Number(data.expires_in) * 1000)
      : null,
    scope: data.scope ?? null,
    token_type: data.token_type ?? "Bearer",
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  const { clientId, clientSecret } = googleConfig();
  if (!clientId || !clientSecret) throw new Error("Google OAuth not configured");
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }).toString(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error_description ?? data?.error ?? `Token refresh failed (${res.status})`);
  }
  return {
    access_token: data.access_token,
    refresh_token: refreshToken,
    expiry_date: data.expires_in
      ? new Date(Date.now() + Number(data.expires_in) * 1000)
      : null,
    scope: data.scope ?? null,
    token_type: data.token_type ?? "Bearer",
  };
}

export async function saveTokens(userId: string, tokens: GoogleTokens): Promise<void> {
  const sb = supabaseServer();
  await sb.from("calendar_tokens").upsert(
    {
      user_id: userId,
      provider: "google",
      access_token: tokens.access_token,
      // Never overwrite an existing refresh_token with null — Google only returns it once.
      ...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
      token_type: tokens.token_type,
      scope: tokens.scope,
      expiry_date: tokens.expiry_date?.toISOString() ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
}

/**
 * Returns a valid access token for the user, refreshing if expired.
 * Returns null if the user has not connected Google.
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const sb = supabaseServer();
  const { data } = await sb
    .from("calendar_tokens")
    .select("access_token, refresh_token, expiry_date")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;

  const expires = data.expiry_date ? new Date(data.expiry_date).getTime() : 0;
  const skewMs = 60_000; // refresh a minute before expiry
  if (expires && expires - skewMs > Date.now()) return data.access_token as string;

  if (!data.refresh_token) return data.access_token as string; // best-effort
  const refreshed = await refreshAccessToken(data.refresh_token as string);
  await saveTokens(userId, refreshed);
  return refreshed.access_token;
}

export async function deleteTokens(userId: string): Promise<void> {
  const sb = supabaseServer();
  await sb.from("calendar_tokens").delete().eq("user_id", userId);
}

export async function getConnectionStatus(userId: string): Promise<{
  connected: boolean;
  connected_at: string | null;
  scope: string | null;
}> {
  const sb = supabaseServer();
  const { data } = await sb
    .from("calendar_tokens")
    .select("connected_at, scope")
    .eq("user_id", userId)
    .maybeSingle();
  return {
    connected: !!data,
    connected_at: data?.connected_at ?? null,
    scope: data?.scope ?? null,
  };
}
