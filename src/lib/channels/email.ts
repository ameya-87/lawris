import type { NotificationChannel, NotificationPayload, DeliveryResult } from "./types";

/**
 * Email channel — FUTURE HOOK.
 *
 * Not implemented for the hackathon. When wiring real email delivery
 * (e.g. Resend, SendGrid, Postmark, SES), populate `deliver` and have
 * `available()` return true once credentials are configured.
 *
 * Intentionally side-effect free today: returns `delivered: false` so
 * the channel registry can skip it without raising an error.
 */
export const emailChannel: NotificationChannel = {
  name: "email",
  available() {
    return Boolean(process.env.EMAIL_PROVIDER_API_KEY);
  },
  async deliver(_payload: NotificationPayload): Promise<DeliveryResult> {
    return {
      channel: "email",
      delivered: false,
      reason: "email channel not implemented (future hook)",
    };
  },
};
