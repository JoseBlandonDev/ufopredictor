export type EmailType =
  | "welcome"
  | "purchase_confirmation"
  | "golden_hour_alert"
  | "daily_summary"
  | "plan_expiration";

export type EmailEvent = {
  id: string;
  userId?: string;
  email: string;
  type: EmailType;
  status: "queued" | "sent" | "failed";
  providerMessageId?: string;
  sentAt?: string;
  errorMessage?: string;
};
