import type { NotificationChannel, NotificationPayload, DeliveryResult } from "./types";

/**
 * WhatsApp channel — FUTURE HOOK.
 *
 * Not implemented for the hackathon. Plug in a provider (Twilio,
 * WhatsApp Business API, Gupshup) inside `deliver`, and have
 * `available()` return true when credentials are set.
 */
export const whatsappChannel: NotificationChannel = {
  name: "whatsapp",
  available() {
    return Boolean(process.env.WHATSAPP_PROVIDER_API_KEY);
  },
  async deliver(_payload: NotificationPayload): Promise<DeliveryResult> {
    return {
      channel: "whatsapp",
      delivered: false,
      reason: "whatsapp channel not implemented (future hook)",
    };
  },
};
