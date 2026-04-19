import { CALENDAR_EVENTS_URL } from "./config";
import { getValidAccessToken } from "./oauth";

export interface CalendarEventInput {
  title: string;
  description?: string;
  dueDate: string;       // YYYY-MM-DD
  dueTime?: string;      // HH:MM (24h); if omitted, created as all-day event
  location?: string | null;
  reminderMinutes?: number[];
  timeZone?: string;     // e.g. "Asia/Kolkata"
}

export interface GoogleEvent {
  id: string;
  htmlLink?: string;
}

export class GoogleCalendarError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function createCalendarEvent(
  userId: string,
  input: CalendarEventInput,
): Promise<GoogleEvent> {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) {
    throw new GoogleCalendarError("Google Calendar not connected", 401);
  }

  const tz = input.timeZone ?? "Asia/Kolkata";
  const body: Record<string, unknown> = {
    summary: input.title,
    description: input.description,
    location: input.location ?? undefined,
    reminders: {
      useDefault: false,
      overrides: (input.reminderMinutes ?? [60 * 24, 60]).map((m) => ({
        method: "popup",
        minutes: m,
      })),
    },
  };

  if (input.dueTime) {
    const startIso = `${input.dueDate}T${input.dueTime}:00`;
    const end = new Date(`${startIso}`);
    end.setHours(end.getHours() + 1);
    const endIso =
      `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}` +
      `T${pad(end.getHours())}:${pad(end.getMinutes())}:00`;
    body.start = { dateTime: startIso, timeZone: tz };
    body.end = { dateTime: endIso, timeZone: tz };
  } else {
    // All-day event: end date is exclusive, so add one day.
    const d = new Date(input.dueDate);
    d.setDate(d.getDate() + 1);
    const endDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    body.start = { date: input.dueDate };
    body.end = { date: endDate };
  }

  const res = await fetch(CALENDAR_EVENTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new GoogleCalendarError(
      data?.error?.message ?? `Calendar create failed (${res.status})`,
      res.status,
    );
  }
  return { id: data.id as string, htmlLink: data.htmlLink as string | undefined };
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}
