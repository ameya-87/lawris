export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  urgency: "critical" | "high" | "medium" | "low";
  caseId?: string | null;
  dueAt?: string | null;
  link?: string | null;
}

export interface DeliveryResult {
  channel: string;
  delivered: boolean;
  reason?: string;
}

export interface NotificationChannel {
  name: string;
  /** Whether this channel is configured and should be used. */
  available(): boolean;
  /** Deliver a payload. Must not throw — return a structured result. */
  deliver(payload: NotificationPayload): Promise<DeliveryResult>;
}
