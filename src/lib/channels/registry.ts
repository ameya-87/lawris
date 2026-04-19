import type {
  DeliveryResult,
  NotificationChannel,
  NotificationPayload,
} from "./types";
import { emailChannel } from "./email";
import { whatsappChannel } from "./whatsapp";

/**
 * Channel registry. In-app notifications are always the primary surface;
 * these external channels are opt-in extensions.
 *
 * To add a new channel (e.g. SMS, Slack): create `./slack.ts` exporting a
 * `NotificationChannel`, then push it into this array.
 */
const CHANNELS: NotificationChannel[] = [emailChannel, whatsappChannel];

/**
 * Fan out a notification to every available external channel.
 * Never throws — collects per-channel results.
 */
export async function broadcast(
  payload: NotificationPayload,
): Promise<DeliveryResult[]> {
  const active = CHANNELS.filter((c) => c.available());
  if (active.length === 0) return [];
  return Promise.all(
    active.map((c) =>
      c.deliver(payload).catch((e) => ({
        channel: c.name,
        delivered: false,
        reason: e instanceof Error ? e.message : "unknown error",
      })),
    ),
  );
}

export function listChannels(): { name: string; available: boolean }[] {
  return CHANNELS.map((c) => ({ name: c.name, available: c.available() }));
}
