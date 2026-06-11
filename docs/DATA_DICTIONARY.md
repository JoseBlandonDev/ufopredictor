# UFO Predictor — Data Dictionary

Last refreshed: post-E05 / first public World Cup fixture publication.

This dictionary focuses on the product and Real Fixture Lab data model currently used by MVP 1. It includes field names confirmed during the E03/E05 World Cup publication work, including several columns that were discovered by failed exploratory queries. Humanity invented schemas and then forgot to document them; this file is the apology letter.

## Core scope vocabulary

### Match access scope

`matches.access_scope` controls whether a match is internal/admin-only or visible through public projections.

Known values in current flow:

- `admin_only` — default for real API-Football ingested fixtures; visible in admin/Real Fixture Lab only.
- `public` — visible through public prediction surfaces when paired with a public-product competition and public-product prediction.

Legacy/internal values may exist in older migrations or fixtures, but MVP 1 World Cup publication uses only `admin_only -> public`.

### Prediction run scope

`prediction_versions.run_scope` separates internal Lab predictions from public product predictions.

Known values:

- `internal_lab` — saved internal Real Fixture Lab prediction.
- `public_product` — public-safe copy of a selected internal prediction.

### Prediction type

Current MVP 1 real fixture prediction type:

- `pre_match_24h`

## `competitions`

Purpose: stores competitions/tournaments such as World Cup 2026.

Confirmed fields:

| Field | Notes |
|---|---|
| `id` | UUID primary key. |
| `external_id` | Provider or legacy external id. Example: `api-football:league:1`; legacy example: `mock-world-cup-2026`. |
| `slug` | Unique slug. Example: `world-cup-2026`. |
| `name` | Display name. |
| `usage_scope` | Product scope. World Cup uses `public_product`. |
| `created_at` | Timestamp. |
| `updated_at` | Timestamp. |

Important behavior:

- The World Cup competition may pre-exist as a legacy/mock row with `slug='world-cup-2026'` and non-API external id.
- E03D updated ingest writer behavior so competitions can be reused by slug when external id does not match.
- If an existing row has `external_id = null`, the writer may backfill it.
- If an existing row has a non-null legacy/mock `external_id`, the writer preserves it.

## `seasons`

Purpose: stores competition seasons.

Confirmed fields from schema/runtime evidence:

| Field | Notes |
|---|---|
| `id` | UUID primary key. |
| `competition_id` | FK to `competitions`. |
| `name` | Season label, e.g. `2026`. |
| `created_at` | Timestamp. |
| `updated_at` | Timestamp. |

Important correction:

- `seasons` does not expose `external_id` in the current live schema, even though ingest uses planned external identifiers internally.

## `teams`

Purpose: stores teams/national teams.

Confirmed fields:

| Field | Notes |
|---|---|
| `id` | UUID primary key. |
| `external_id` | Provider or legacy external id. Examples: `api-football:team:1531`, `mock-mexico`. |
| `slug` | Unique team slug. Examples: `mexico`, `south-africa`. |
| `name` | Display name. |
| `country` | Country metadata; may be `NULL`. |
| `created_at` | Timestamp. |
| `updated_at` | Timestamp. |

Important behavior:

- E03E updated ingest writer behavior so teams can be reused by slug when external id does not match.
- Mexico existed as a legacy/mock row (`mock-mexico`) before the World Cup ingest.
- South Africa was inserted as an API-Football row during the first exact World Cup apply.
- If an existing team has `external_id = null`, the writer may backfill it.
- If an existing team has a non-null legacy/mock `external_id`, the writer preserves it.

## `matches`

Purpose: stores fixtures/matches.

Confirmed fields:

| Field | Notes |
|---|---|
| `id` | UUID primary key. |
| `competition_id` | FK to `competitions`. |
| `season_id` | FK to `seasons`. |
| `external_id` | Provider external id. Example: `api-football:fixture:1489369`. |
| `slug` | Unique match slug. Example: `world-cup-2026-mexico-vs-south-africa-2026-06-11`. |
| `home_team_id` | FK to `teams`. |
| `away_team_id` | FK to `teams`. |
| `kickoff_at` | Kickoff timestamp. |
| `status` | Match status. Scheduled World Cup fixture uses `scheduled`. |
| `access_scope` | `admin_only` by ingest default; `public` after manual publication. |
| `intake_source` | Real API-Football fixtures use `api_football`. |
| `venue_id` | Currently planned as `NULL` unless provider venue support is added. |
| `source_note` | Audit/source text where available. |
| `data_quality` | Internal data-quality metadata where available. |
| `stage` | Competition stage/round where available. |
| `lab_status` | Lab/review status where available. |
| `reviewed_at` | Review timestamp where applicable. |
| `reviewed_by` | Reviewer id where applicable. |
| `created_at` | Timestamp. |
| `updated_at` | Timestamp. |

Important behavior:

- World Cup ingest creates matches as `access_scope='admin_only'` and `intake_source='api_football'`.
- The public product requires `matches.access_scope='public'` and a competition with `usage_scope='public_product'`.
- Manual publication changes only `matches.access_scope` from `admin_only` to `public`.
- The runtime-proven path uses RPC `publish_real_fixture_match_access_scope(target_match_id uuid, target_match_slug text)` from migration `0029_manual_publication_match_access_scope_rpc.sql`.
- Do not update public visibility by ad hoc SQL unless explicitly performing a controlled rollback/recovery.

First public World Cup match:

- id: `00ce2fbc-4ac1-4a47-a97e-c345745e31ef`
- external_id: `api-football:fixture:1489369`
- slug: `world-cup-2026-mexico-vs-south-africa-2026-06-11`
- status: `scheduled`
- intake_source: `api_football`
- access_scope: `public`

## `model_versions`

Purpose: stores model contracts/version metadata.

Confirmed fields:

| Field | Notes |
|---|---|
| `id` | UUID primary key. |
| `version` | Human-readable model version. Examples: `v0.1`, `v0.2-prelaunch`. |
| `description` | Version description. |
| `weights_json` | Model weights/config JSON. |
| `is_active` | Active model flag. |
| `created_at` | Timestamp. |
| `updated_at` | Timestamp. |

Important corrections:

- There is no `version_key` column in the current live schema.
- Use `model_versions.version` when joining from `prediction_versions.model_version_id`.
- Active MVP 1 model is `v0.2-prelaunch`.

## `prediction_versions`

Purpose: stores prediction payloads for a match.

Confirmed fields:

| Field | Notes |
|---|---|
| `id` | UUID primary key. |
| `match_id` | FK to `matches`. |
| `run_scope` | `internal_lab` or `public_product`. |
| `prediction_type` | Current real fixture type: `pre_match_24h`. |
| `model_version_id` | FK to `model_versions`. |
| `created_at` | Timestamp. |

Important corrections:

- There is no `model_version` column on `prediction_versions`; join through `model_version_id` to `model_versions.version`.
- There is no `updated_at` column on `prediction_versions` in current live schema.
- There is currently no DB-native lineage field linking a `public_product` row back to its source `internal_lab` row.
- There is no confirmed `source_prediction_version_id`, `source_note`, or generic `metadata_json` on this table.

Public publication behavior:

- Manual publication copies public-safe fields from one selected `internal_lab` prediction version into a new `public_product` prediction version.
- The internal row remains untouched.
- Existing matching `public_product` rows are reused idempotently.
- E05 intentionally does not copy `prediction_markets`.
- E05 intentionally does not write or expose `prediction_results`.

First public fixture prediction rows:

- public_product id: `5787306d-ee3a-4167-88ab-ce669f1ed644`
- internal_lab id: `301a6ac4-b20c-4098-967e-9f124144f25f`
- match id: `00ce2fbc-4ac1-4a47-a97e-c345745e31ef`
- model version: `v0.2-prelaunch`

## `prediction_markets`

Purpose: stores market/outcome rows derived from a prediction version.

Confirmed fields:

| Field | Notes |
|---|---|
| `id` | UUID primary key. |
| `prediction_version_id` | FK to `prediction_versions`. |
| `market` | Market name. Examples: `match_winner`, `over_2_5`, `btts`, `exact_score`. |
| `selection` | Outcome selection. Examples: `home`, `draw`, `away`, `over`, `under`, `yes`, `no`, score strings. |
| `probability` | Numeric probability. |
| `confidence` | Numeric confidence. |
| `is_premium` | Premium-gating flag. |
| `created_at` | Timestamp. |

Important corrections:

- There is no `market_key` column in the current live schema.
- There is no `outcome_key` column in the current live schema.
- Use `market` and `selection`.

Current MVP 1 behavior:

- Manual basic publication does not copy markets.
- Public basic cards/details currently rely primarily on `prediction_versions` and public projections.
- Premium market publication is a future decision, not part of E05.

## `prediction_results`

Purpose: stores internal post-match evaluation results.

Current boundary:

- Internal only.
- Written by Real Fixture Lab evaluation flows after results are verified.
- Not used for public publication.
- Not exposed in `public_prediction_summaries`, `public_match_details`, or premium/public projections.

Do not add `prediction_results` to public views without a separate reviewed epic.

## Ingest tracking tables

Purpose: track API-Football ingest runs and item-level audit results.

Known tables:

- `ingest_runs`
- `ingest_run_items`

Behavior:

- exact apply failures can leave audit/run-tracking rows even when domain rows fail later;
- this is expected because the writer is not fully transaction-wrapped;
- source notes and run tags are used to locate created/updated rows;
- rollback remains manual/script-reviewed.

## Public read projections

Public UI reads through safe query/projection boundaries, especially:

- `public_prediction_summaries`
- `public_match_details`

A match appears publicly only when:

- `matches.access_scope = 'public'`
- its competition has `competitions.usage_scope = 'public_product'`
- it has a compatible `prediction_versions` row with `run_scope='public_product'`

## Publication RPCs and helpers

### Runtime-proven RPC

`public.publish_real_fixture_match_access_scope(target_match_id uuid, target_match_slug text)`

Introduced in:

- `0029_manual_publication_match_access_scope_rpc.sql`

Behavior:

- `SECURITY DEFINER`
- exact match id + slug only
- requires admin user
- requires current row to be `admin_only + scheduled + api_football`
- requires linked competition `usage_scope='public_product'`
- updates only `matches.access_scope='public'`
- returns updated match id or `null`

This is the stable publication path after direct RLS update attempts failed at runtime.

### Earlier publication RLS migrations

- `0025_manual_publication_rls.sql`
- `0026_fix_manual_publication_match_update_policy.sql`
- `0027_inline_manual_publication_match_update_check.sql`
- `0028_manual_publication_match_new_row_helper.sql`

These are part of the applied history and should not be edited. The E05-G RPC in `0029` is the runtime-proven access-scope flip path.
