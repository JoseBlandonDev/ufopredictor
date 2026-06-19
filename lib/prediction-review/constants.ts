export const PREDICTION_REFRESH_REVIEW_PATH = "/admin/prediction-refresh-review" as const;
export const SIGNAL_SOURCE_SNAPSHOT_ID = "2026-06-19" as const;
export const SIGNAL_SOURCE_LABEL = "national-team-signals/2026-06-19" as const;
export const REVIEW_WINDOW_DAYS = 14;
export const REVIEW_PROVIDER_LABEL = "api-football" as const;
export const REVIEW_DECISION_OPTIONS = [
  "KEEP_CURRENT",
  "PUBLISH_REFRESHED",
  "PROPOSE_REVIEWED_XG",
  "HOLD",
] as const;
export const REVIEW_SNAPSHOT_KINDS = [
  "current_reference",
  "shadow_refresh",
  "reviewed_xg_preview",
  "published_output",
] as const;
export const REVIEW_ALERT_SEVERITIES = ["info", "watch", "manual_review", "critical"] as const;
export const REVIEW_CONFIDENCE_BUCKETS = ["low", "medium", "high"] as const;
export const REVIEW_XG_BOUNDS = {
  minPerTeam: 0.1,
  maxPerTeam: 3.5,
  minCombined: 0.5,
  maxCombined: 5.5,
  maxAbsDeltaPerTeam: 0.75,
  maxTotalAbsDelta: 1,
} as const;
