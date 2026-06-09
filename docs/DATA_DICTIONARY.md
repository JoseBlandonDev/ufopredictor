# Data Dictionary — UFO Predictor

_Last updated after D05F, D05G, and Real Fixture Lab Phase 3A._

## `matches`

Stores match fixtures.

Important current fields:

- `external_id`: provider-stable id, e.g. `api-football:fixture:1540356`.
- `access_scope`: visibility scope.
- `intake_source`: source of fixture data.
- `status`: normalized match status.
- `kickoff_at`: kickoff timestamp.
- `source_note`: provider/run trace metadata.

Current API-Football behavior:

- New provider fixtures are persisted with:
  - `access_scope='admin_only'`.
  - `intake_source='api_football'`.
- Real Fixture Lab only reads matches with this pair.
- Public views should not expose `admin_only` matches.

## `match_results`

Stores actual match results.

Important current behavior:

- Scheduled fixtures should not create `match_results`.
- Finished provider fixtures may create pending-review result rows.
- Real Fixture Lab Phase 3A does not evaluate predictions and does not write `prediction_results`.

## `ingest_runs`

Added in `0018_ingest_run_tracking.sql`.

Purpose:

- Durable header for real API-Football apply runs.

Important fields:

- `id`.
- `provider`.
- `competition_key`.
- `provider_league_id`.
- `from_date`.
- `to_date`.
- `limit_value`.
- `apply_mode`.
- `run_tag`.
- `source_note`.
- `status`.
- `started_at`.
- `finished_at`.
- `fetched_fixtures_count`.
- `planned_fixtures_count`.
- `counts_summary`.
- `warnings_summary`.
- `errors_summary`.
- `cli_args`.

Current statuses:

- `started`.
- `completed`.
- `failed`.
- `rolled_back_partial`.
- `rolled_back_full`.

Current use:

- created only for real apply runs.
- dry-runs remain DB-write-free.

## `ingest_run_items`

Added in `0018_ingest_run_tracking.sql`.

Purpose:

- Per-run entity-level audit and snapshot metadata.

Important fields:

- `run_id`.
- `entity_table`.
- `entity_id`.
- `entity_external_id`.
- `entity_natural_key`.
- `action`.
- `before_snapshot`.
- `after_snapshot`.
- `skip_reason`.
- `error_message`.

Actions:

- `created`.
- `updated`.
- `skipped`.
- `error`.

Snapshot rules:

- `updated` requires `before_snapshot`.
- `created` does not need `before_snapshot`.
- `after_snapshot` is useful for audit/debugging.

## `model_versions`

Stores model version metadata.

Current Real Fixture Lab use:

- Save action selects an active model version.
- Preferred rule:
  - `is_active=true`.
  - newest deterministic row by `created_at desc`.
- Validation used model version `v0.1`.

RLS note:

- `0021` and `0022` allow required admin read behavior for Real Fixture Lab persistence.

## `prediction_versions`

Stores prediction header rows.

Current Real Fixture Lab Phase 3A use:

- One internal prediction per match/model/prediction type/run scope.
- App-level duplicate blocking for:
  - `match_id`.
  - `model_version_id`.
  - `prediction_type='pre_match_24h'`.
  - `run_scope='internal_lab'`.

Fields used by Real Fixture Lab:

- `match_id`.
- `model_version_id`.
- `prediction_type`.
- `home_win_prob`.
- `draw_prob`.
- `away_win_prob`.
- `expected_home_goals`.
- `expected_away_goals`.
- `most_likely_score`.
- `top_scores_json`.
- `confidence_score`.
- `risk_level`.
- `run_scope`.

Current scope:

- internal only.
- `run_scope='internal_lab'`.
- `prediction_type='pre_match_24h'`.

## `prediction_markets`

Stores market-level prediction rows linked to `prediction_versions`.

Current Real Fixture Lab fields:

- `prediction_version_id`.
- `market`.
- `selection`.
- `probability`.
- `confidence`.
- `is_premium`.

Current markets produced:

- `match_winner`.
- `btts`.
- `over_2_5`.
- `exact_score`.

Real Fixture Lab uses:

- `is_premium=false`.

## `prediction_results`

Stores post-match evaluation results.

Current status:

- Not written by Real Fixture Lab Phase 3A.
- Must remain empty until a result review/evaluation phase is designed.

Future use:

- evaluate persisted prediction after trusted/verified result.
- store internal evaluation outcome.

## Access scope values used in current flow

- `admin_only`: real ingested fixture internal/admin visibility.
- `lab_only`: old/synthetic Beta Lab calibration fixtures.
- `public` / `premium`: product-facing scopes, not used by Real Fixture Lab current flow.

## Intake source values used in current flow

- `api_football`: provider-ingested fixture/result data.

Real Fixture Lab filters strictly on `api_football`.
