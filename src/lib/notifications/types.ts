export type NotificationType =
  | "upcoming_hearing"
  | "deadline_approaching"
  | "document_required"
  | "document_missing"
  | "reminder_overdue"
  | "stage_followup";

export type NotificationUrgency = "critical" | "high" | "medium" | "low";
export type NotificationStatus = "unread" | "read" | "dismissed";
export type NotificationSourceType = "deadline" | "hearing" | "document" | "manual";

export interface NotificationRow {
  id: string;
  user_id: string;
  case_id: string | null;
  source_type: NotificationSourceType | null;
  source_id: string | null;
  type: NotificationType;
  title: string;
  message: string | null;
  urgency: NotificationUrgency;
  due_at: string | null;
  status: NotificationStatus;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationWithCase extends NotificationRow {
  case_title: string | null;
}
