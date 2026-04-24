export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "openid",
  "email",
] as const;

export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
export const CALENDAR_EVENTS_URL =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

export function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const explicitRedirect = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const redirectUri =
    explicitRedirect ??
    (appUrl ? `${appUrl.replace(/\/$/, "")}/api/integrations/google/callback` : undefined);
  return { clientId, clientSecret, redirectUri } as {
    clientId: string | undefined;
    clientSecret: string | undefined;
    redirectUri: string | undefined;
  };
}

export function isGoogleConfigured(): boolean {
  const c = googleConfig();
  return Boolean(c.clientId && c.clientSecret && c.redirectUri);
}
