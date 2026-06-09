# UFO Predictor — Data Dictionary

Last refreshed: after PR #40.

This dictionary focuses on the currently relevant product and Real Fixture Lab data model.

## `matches`

Represents a football fixture/match.

Important fields:

- `id` — internal UUID.
- `external_id` — provider-scoped external ID, e.g. `api-football:fixture:1540356`.
- `access_scope` — controls public/internal lane. Real Fixture Lab fixtures use `admin_only`.
- `intake_source` — source of fixture, e.g. `api_football`.
- status/kickoff/team/competition fields as defined by migrations.

Current Real Fixture Lab guard:

- target fixtures must be `admin_only + api_football`.

## `match_results`

Represents final or reviewed score for one match.

Important fields:

- `match_id` — unique; one result row per match.
- `home_goals`.
- `away_goals`.
- `verification_status`:
  - `pending_review`;
  - `verified`;
  - `rejected`.
- `intake_source` — includes `api_football` after migration expansion.
- `source_note`.
- `reviewed_at`.
- `reviewed_by`.
- `recorded_at`.

Current rules:

- API-Football result ingest creates/updates `pending_review` rows.
- Ingest skips rows already `verified` or `rejected`.
- Real Fixture Lab can verify existing `pending_review` rows.
- No score-editing UI.
- No result-creation UI.

## `prediction_versions`

Represents a saved prediction run/version.

Important fields:

- `id`.
- match reference.
- `run_scope` — internal Lab uses `internal_lab`.
- `prediction_type` — Real Fixture Lab uses `pre_match_24h`.
- `model_version`, currently `v0.1`.
- prediction payload / model output fields per existing schema.

## `prediction_markets`

Stores market outputs for saved predictions.

Relevant markets:

- 1X2;
- BTTS;
- over/under 2.5;
- top scorelines/projection fields as represented by current implementation.

## `prediction_results`

Stores internal evaluation results after a verified match result exists.

Important fields:

- `prediction_version_id` — unique for one evaluation row per saved prediction version.
- `actual_home_goals`.
- `actual_away_goals`.
- `winner_correct`.
- `btts_correct`.
- `over_2_5_correct`.
- `exact_score_correct`.
- `goal_error`.
- `error_summary`.
- `validated_at`.

Current rules:

- internal-only;
- requires verified `match_results`;
- no public exposure yet;
- may be refreshed explicitly from verified result.

## `ingest_runs`

Tracks controlled API-Football ingest runs.

Use:

- operator evidence;
- dry-run/apply tracking;
- run-level metadata.

## `ingest_run_items`

Tracks item-level ingest effects.

Use:

- before/after snapshots;
- created/updated/skipped evidence;
- match/result write tracking.

## Payment/entitlement data

Not finalized.

Do not invent tables in docs as if implemented.

Future MVP 1 likely needs:

- payment provider record;
- one-time tournament pass entitlement;
- premium access state;
- account/payment status view.

Payment provider is open: PayPal or selected/available gateway. Stripe is not assumed.

Recurring subscription data belongs to post-World-Cup Epic L unless pulled forward explicitly.
