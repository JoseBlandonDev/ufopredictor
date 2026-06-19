import type { Match } from "./football";
import type { Plan, UserEntitlement, UserMatchUnlock } from "./plans";
import type { Prediction } from "./prediction";
import type { WorkerRun } from "./workers";

// Replace these hand-maintained contracts with Supabase CLI generated types once the app is linked.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamp = string;
type DateValue = string;
type Insert<Row, Required extends keyof Row> = Pick<Row, Required> & Partial<Omit<Row, Required>>;
type Update<Row> = Partial<Row>;

export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  country: string | null;
  preferred_language: string;
  role: "free_user" | "premium_user" | "admin";
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type PlanRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: "USD" | "COP" | "EUR";
  billing_type: "free" | "one_time" | "monthly" | "custom_pack";
  is_active: boolean;
  starts_at: Timestamp | null;
  ends_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type PlanFeatureRow = {
  id: string;
  plan_id: string;
  feature_key: string;
  feature_value: Json;
  created_at: Timestamp;
};

export type SubscriptionRow = {
  id: string;
  user_id: string;
  plan_id: string;
  status: "active" | "expired" | "cancelled" | "pending";
  starts_at: Timestamp | null;
  ends_at: Timestamp | null;
  payment_provider: string | null;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type UserEntitlementRow = {
  id: string;
  user_id: string;
  entitlement_type: string;
  resource_type: "competition" | "match" | "stage" | "team" | "global";
  resource_id: string;
  quantity: number | null;
  starts_at: Timestamp | null;
  ends_at: Timestamp | null;
  source_plan_id: string | null;
  created_at: Timestamp;
};

export type UserMatchUnlockRow = {
  id: string;
  user_id: string;
  match_id: string;
  source_plan_id: string | null;
  unlocked_at: Timestamp;
  expires_at: Timestamp | null;
};

export type EntitlementGrantRow = {
  id: string;
  idempotency_key: string;
  source_type: "manual_admin" | "wompi_webhook" | "wompi_transaction" | "system";
  source_reference: string | null;
  user_id: string;
  plan_id: string | null;
  subscription_id: string | null;
  user_entitlement_id: string | null;
  user_match_unlock_id: string | null;
  grant_type:
    | "global_premium_access"
    | "competition_access"
    | "stage_access"
    | "team_access"
    | "match_access"
    | "match_unlock";
  resource_type: "competition" | "match" | "stage" | "team" | "global";
  resource_id: string | null;
  match_id: string | null;
  starts_at: Timestamp;
  ends_at: Timestamp | null;
  status: "active" | "revoked" | "expired";
  created_by: string | null;
  revoked_by: string | null;
  revoked_at: Timestamp | null;
  metadata_json: Json;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type WompiPaymentIntentRow = {
  id: string;
  reference: string;
  user_id: string;
  plan_id: string;
  amount_in_cents: number;
  currency: "COP";
  status: "PENDING" | "APPROVED" | "DECLINED" | "ERROR";
  checkout_payload: Json;
  entitlement_mapping_json: Json;
  expires_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type WompiPaymentEventRow = {
  id: string;
  transaction_id: string | null;
  reference: string | null;
  event_type: string | null;
  status: "PENDING" | "APPROVED" | "DECLINED" | "ERROR" | null;
  checksum: string;
  raw_event_json: Json;
  verified_at: Timestamp | null;
  processed_at: Timestamp | null;
  entitlement_grant_id: string | null;
  processing_error: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type UserSavedMatchRow = {
  id: string;
  user_id: string;
  match_id: string;
  saved_at: Timestamp;
};

export type CompetitionRow = {
  id: string;
  external_id: string | null;
  name: string;
  slug: string;
  country: string | null;
  type: "international" | "league" | "cup";
  usage_scope: "public_product" | "internal_lab";
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type SeasonRow = {
  id: string;
  competition_id: string;
  name: string;
  year: number;
  starts_at: DateValue;
  ends_at: DateValue;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type TeamRow = {
  id: string;
  external_id: string | null;
  name: string;
  slug: string;
  country: string | null;
  logo_url: string | null;
  flag_url: string | null;
  fifa_rank: number | null;
  elo_rating: number | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type PlayerRow = {
  id: string;
  external_id: string | null;
  team_id: string | null;
  name: string;
  position: string | null;
  is_key_player: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type VenueRow = {
  id: string;
  external_id: string | null;
  name: string;
  city: string | null;
  country: string | null;
  capacity: number | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type MatchRow = {
  id: string;
  external_id: string | null;
  slug: string;
  competition_id: string;
  season_id: string;
  home_team_id: string;
  away_team_id: string;
  venue_id: string | null;
  kickoff_at: Timestamp;
  stage: string | null;
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  access_scope: "public" | "premium" | "admin_only" | "lab_only";
  lab_status: "candidate" | "ready" | "review" | "needs_data" | "archived" | null;
  intake_source: "mock" | "manual" | "csv_import" | "api_football";
  data_quality: "unreviewed" | "reviewed" | "verified" | "rejected";
  source_note: string | null;
  reviewed_at: Timestamp | null;
  reviewed_by: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type TeamFormSnapshotRow = {
  id: string;
  team_id: string;
  snapshot_date: DateValue;
  last_matches_count: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  form_score: number | null;
  created_at: Timestamp;
};

export type LineupRow = {
  id: string;
  match_id: string;
  team_id: string;
  is_confirmed: boolean;
  formation: string | null;
  players_json: Json;
  captured_at: Timestamp;
  source: string | null;
  created_at: Timestamp;
};

export type OddsSnapshotRow = {
  id: string;
  match_id: string;
  bookmaker: string;
  market: string;
  selection: string;
  odds_decimal: number;
  implied_probability: number;
  captured_at: Timestamp;
  source: string | null;
  created_at: Timestamp;
};

export type ModelVersionRow = {
  id: string;
  version: string;
  description: string | null;
  weights_json: Json;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type PredictionVersionRow = {
  id: string;
  match_id: string;
  model_version_id: string;
  prediction_type: "pre_match_24h" | "pre_match_6h" | "post_lineup" | "pre_kickoff";
  home_win_prob: number;
  draw_prob: number;
  away_win_prob: number;
  expected_home_goals: number;
  expected_away_goals: number;
  most_likely_score: string;
  top_scores_json: Json;
  confidence_score: number;
  risk_level: "low" | "medium" | "high";
  run_scope: "public_product" | "internal_lab";
  created_at: Timestamp;
};

export type PredictionMarketRow = {
  id: string;
  prediction_version_id: string;
  market: "match_winner" | "over_2_5" | "btts" | "exact_score";
  selection: string;
  probability: number;
  confidence: number | null;
  is_premium: boolean;
  created_at: Timestamp;
};

export type PredictionNarrativeRow = {
  id: string;
  prediction_version_id: string;
  locale: "es" | "en";
  free_summary: string;
  premium_analysis: string | null;
  why_it_changed: string | null;
  risk_notes: string | null;
  created_at: Timestamp;
};

export type PredictionReviewCaseRow = {
  id: string;
  match_id: string;
  current_prediction_version_id: string | null;
  source_snapshot_id: string;
  provider_status: string | null;
  provider_status_short: string | null;
  provider_kickoff_at: Timestamp | null;
  home_team_name_en: string;
  away_team_name_en: string;
  home_team_display_name_es: string;
  away_team_display_name_es: string;
  model_version_id: string | null;
  refresh_alerts_json: Json;
  coherence_alerts_json: Json;
  retained_fixture_override: boolean;
  status: "pending" | "kept_current" | "published_refreshed" | "held";
  latest_shadow_snapshot_id: string | null;
  latest_reviewed_xg_snapshot_id: string | null;
  latest_ai_execution_id: string | null;
  latest_decision_id: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type PredictionReviewSnapshotRow = {
  id: string;
  review_case_id: string;
  source_prediction_version_id: string | null;
  snapshot_kind: "current_reference" | "shadow_refresh" | "reviewed_xg_preview" | "published_output";
  source_snapshot_id: string;
  model_version_id: string | null;
  prediction_type: "pre_match_24h" | "pre_match_6h" | "post_lineup" | "pre_kickoff";
  review_run_scope: "current_reference" | "shadow_review" | "review_preview" | "published_output";
  home_win_prob: number;
  draw_prob: number;
  away_win_prob: number;
  expected_home_goals: number;
  expected_away_goals: number;
  most_likely_score: string;
  top_scores_json: Json;
  btts_yes_prob: number;
  btts_no_prob: number;
  over_2_5_over_prob: number;
  over_2_5_under_prob: number;
  confidence_score: number;
  risk_level: "low" | "medium" | "high";
  bundle_json: Json;
  created_by: string | null;
  created_at: Timestamp;
};

export type PredictionReviewAiExecutionRow = {
  id: string;
  review_case_id: string;
  provider: string;
  model: string | null;
  status: "succeeded" | "failed" | "unavailable";
  request_json: Json;
  response_json: Json | null;
  error_message: string | null;
  created_by: string | null;
  created_at: Timestamp;
};

export type PredictionReviewDecisionRow = {
  id: string;
  review_case_id: string;
  ai_execution_id: string | null;
  selected_snapshot_id: string | null;
  published_prediction_version_id: string | null;
  decision: "KEEP_CURRENT" | "PUBLISH_REFRESHED" | "PROPOSE_REVIEWED_XG" | "HOLD";
  reason: string;
  rationale: string | null;
  evidence_used_json: Json;
  contradictions_json: Json;
  confidence_label: "low" | "medium" | "high" | null;
  proposed_home_xg: number | null;
  proposed_away_xg: number | null;
  warnings_json: Json;
  human_approval_required: boolean;
  created_by: string | null;
  created_at: Timestamp;
};

export type PredictionResultRow = {
  id: string;
  prediction_version_id: string;
  actual_home_goals: number;
  actual_away_goals: number;
  winner_correct: boolean | null;
  btts_correct: boolean | null;
  over_2_5_correct: boolean | null;
  exact_score_correct: boolean | null;
  goal_error: number | null;
  error_summary: string | null;
  validated_at: Timestamp;
  created_at: Timestamp;
};

export type MatchResultRow = {
  id: string;
  match_id: string;
  home_goals: number;
  away_goals: number;
  verification_status: "pending_review" | "verified" | "rejected";
  intake_source: "mock" | "manual" | "csv_import" | "api_football";
  source_note: string | null;
  reviewed_at: Timestamp | null;
  reviewed_by: string | null;
  recorded_at: Timestamp;
};

export type WorkerRunRow = {
  id: string;
  worker_name: string;
  status: "queued" | "running" | "success" | "failed";
  started_at: Timestamp;
  finished_at: Timestamp | null;
  records_processed: number;
  error_message: string | null;
  metadata_json: Json;
  created_at: Timestamp;
};

export type EmailEventRow = {
  id: string;
  user_id: string | null;
  email: string;
  type: string;
  status: "queued" | "sent" | "failed";
  provider_message_id: string | null;
  metadata_json: Json;
  sent_at: Timestamp | null;
  created_at: Timestamp;
  error_message: string | null;
};

export type DatabaseTables = {
  profiles: ProfileRow;
  plans: PlanRow;
  plan_features: PlanFeatureRow;
  subscriptions: SubscriptionRow;
  user_entitlements: UserEntitlementRow;
  user_match_unlocks: UserMatchUnlockRow;
  entitlement_grants: EntitlementGrantRow;
  wompi_payment_intents: WompiPaymentIntentRow;
  wompi_payment_events: WompiPaymentEventRow;
  user_saved_matches: UserSavedMatchRow;
  competitions: CompetitionRow;
  seasons: SeasonRow;
  teams: TeamRow;
  players: PlayerRow;
  venues: VenueRow;
  matches: MatchRow;
  team_form_snapshots: TeamFormSnapshotRow;
  lineups: LineupRow;
  odds_snapshots: OddsSnapshotRow;
  model_versions: ModelVersionRow;
  prediction_versions: PredictionVersionRow;
  prediction_markets: PredictionMarketRow;
  prediction_narratives: PredictionNarrativeRow;
  prediction_review_cases: PredictionReviewCaseRow;
  prediction_review_snapshots: PredictionReviewSnapshotRow;
  prediction_review_ai_executions: PredictionReviewAiExecutionRow;
  prediction_review_decisions: PredictionReviewDecisionRow;
  prediction_results: PredictionResultRow;
  match_results: MatchResultRow;
  worker_runs: WorkerRunRow;
  email_events: EmailEventRow;
};

type DatabaseInserts = {
  profiles: Insert<ProfileRow, "id">;
  plans: Insert<PlanRow, "name" | "slug" | "billing_type">;
  plan_features: Insert<PlanFeatureRow, "plan_id" | "feature_key">;
  subscriptions: Insert<SubscriptionRow, "user_id" | "plan_id">;
  user_entitlements: Insert<UserEntitlementRow, "user_id" | "entitlement_type" | "resource_type" | "resource_id">;
  user_match_unlocks: Insert<UserMatchUnlockRow, "user_id" | "match_id">;
  entitlement_grants: Insert<EntitlementGrantRow, "idempotency_key" | "source_type" | "user_id" | "grant_type" | "resource_type" | "starts_at">;
  wompi_payment_intents: Insert<WompiPaymentIntentRow, "reference" | "user_id" | "plan_id" | "amount_in_cents" | "currency">;
  wompi_payment_events: Insert<WompiPaymentEventRow, "checksum" | "raw_event_json">;
  user_saved_matches: Insert<UserSavedMatchRow, "user_id" | "match_id">;
  competitions: Insert<CompetitionRow, "name" | "slug" | "type">;
  seasons: Insert<SeasonRow, "competition_id" | "name" | "year" | "starts_at" | "ends_at">;
  teams: Insert<TeamRow, "name" | "slug">;
  players: Insert<PlayerRow, "name">;
  venues: Insert<VenueRow, "name">;
  matches: Insert<MatchRow, "slug" | "competition_id" | "season_id" | "home_team_id" | "away_team_id" | "kickoff_at">;
  team_form_snapshots: Insert<TeamFormSnapshotRow, "team_id" | "snapshot_date" | "last_matches_count">;
  lineups: Insert<LineupRow, "match_id" | "team_id">;
  odds_snapshots: Insert<OddsSnapshotRow, "match_id" | "bookmaker" | "market" | "selection" | "odds_decimal" | "implied_probability">;
  model_versions: Insert<ModelVersionRow, "version">;
  prediction_versions: Insert<PredictionVersionRow, "match_id" | "model_version_id" | "prediction_type" | "home_win_prob" | "draw_prob" | "away_win_prob" | "expected_home_goals" | "expected_away_goals" | "most_likely_score" | "confidence_score" | "risk_level">;
  prediction_markets: Insert<PredictionMarketRow, "prediction_version_id" | "market" | "selection" | "probability">;
  prediction_narratives: Insert<PredictionNarrativeRow, "prediction_version_id" | "locale" | "free_summary">;
  prediction_review_cases: Insert<PredictionReviewCaseRow, "match_id" | "source_snapshot_id" | "home_team_name_en" | "away_team_name_en" | "home_team_display_name_es" | "away_team_display_name_es">;
  prediction_review_snapshots: Insert<PredictionReviewSnapshotRow, "review_case_id" | "snapshot_kind" | "source_snapshot_id" | "prediction_type" | "review_run_scope" | "home_win_prob" | "draw_prob" | "away_win_prob" | "expected_home_goals" | "expected_away_goals" | "most_likely_score" | "btts_yes_prob" | "btts_no_prob" | "over_2_5_over_prob" | "over_2_5_under_prob" | "confidence_score" | "risk_level" | "bundle_json">;
  prediction_review_ai_executions: Insert<PredictionReviewAiExecutionRow, "review_case_id" | "provider" | "status" | "request_json">;
  prediction_review_decisions: Insert<PredictionReviewDecisionRow, "review_case_id" | "decision" | "reason" | "evidence_used_json" | "contradictions_json" | "warnings_json" | "human_approval_required">;
  prediction_results: Insert<PredictionResultRow, "prediction_version_id" | "actual_home_goals" | "actual_away_goals">;
  match_results: Insert<MatchResultRow, "match_id" | "home_goals" | "away_goals">;
  worker_runs: Insert<WorkerRunRow, "worker_name" | "status">;
  email_events: Insert<EmailEventRow, "email" | "type">;
};

export type DatabaseTableName = keyof DatabaseTables;
export type DatabaseRow<Table extends DatabaseTableName> = DatabaseTables[Table];
export type DatabaseInsert<Table extends DatabaseTableName> = DatabaseInserts[Table];
export type DatabaseUpdate<Table extends DatabaseTableName> = Update<DatabaseTables[Table]>;

export type DatabaseMock = {
  matches: Match[];
  predictions: Prediction[];
  plans: Plan[];
  userEntitlements: UserEntitlement[];
  userMatchUnlocks: UserMatchUnlock[];
  workerRuns: WorkerRun[];
};
