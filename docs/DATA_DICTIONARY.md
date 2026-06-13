# Data Dictionary - UFO Predictor

_Last refreshed: post PR #71 plus parallel work planning._

## Purpose

This file summarizes project-level data concepts and public/internal boundaries. It is not a full database schema dump.

## Core entities

### competitions

Represents competitions such as World Cup 2026.

Important concepts:

- `usage_scope = public_product` for public product competitions.
- Public fixture flows should only expose controlled public competition data.

### matches

Represents fixtures/matches.

Important fields/concepts:

- `external_id` such as `api-football:fixture:<id>`.
- `intake_source = api_football` for real fixtures ingested from API-Football.
- `access_scope` controls admin/public reach.
- `status` can include scheduled/finished states.
- venue metadata is incomplete and may remain null/unknown.

### teams

Represents teams from provider/canonical data.

World Cup canonical team enrichment is separate from raw provider team rows.

### prediction_versions

Stores prediction version rows.

Key concepts:

- `run_scope = internal_lab` for internal/admin predictions.
- `run_scope = public_product` for public-facing prediction rows.
- `prediction_type = pre_match_24h` for the current main real fixture prediction type.
- Refresh is append-only: new versions are inserted rather than mutating old ones.

### prediction_markets

Stores market/probability rows associated with predictions.

Public basic surface uses public-safe 1X2 and summary probabilities.

### match_results

Stores match results and verification state.

Current public projection only exposes verified final result fields.

Public-safe verified fields include:

- verified home goals;
- verified away goals;
- verification status when verified.

Unverified/pending results should not be treated as final public truth.

### prediction_results

Internal evaluation results only.

Do not expose publicly.

Examples of internal evaluation fields that must remain private:

- exact score correctness;
- winner correctness;
- goal error;
- evaluation payloads;
- internal audit data.

## Public views / projections

### public_prediction_summaries

Public-safe summary for public prediction cards/list.

After PR #70 / migration `0034_public_verified_match_results_projection.sql`, it can include verified final result fields appended to the existing projection.

Must not expose `prediction_results`.

### public_match_details

Public-safe detail projection for selected public matches.

After PR #70 / migration `0034_public_verified_match_results_projection.sql`, it can include verified final result fields.

Must not expose internal Lab/evaluation data.

## Model signal concepts

E10C generated runtime-safe signal metadata for 48 canonical World Cup teams:

- FIFA rank / points;
- Elo rank / rating;
- Elo average rank / rating;
- historical goals for per match;
- historical goals against per match;
- recentMatchCount;
- neutral `marketScore: 50`;
- neutral `lineupContextScore: 50`.

Raw source files and `codex-inputs/` are not runtime dependencies and must not be committed unless explicitly scoped.

## Product platform data concepts planned for Epic G

Epic G may propose but should not blindly apply real schema changes for:

- profiles/account state;
- plans;
- subscriptions;
- entitlements;
- billing events;
- payment provider customer IDs;
- premium access state.

Any payment/subscription schema should be reviewed before migrations are applied.

## Boundary reminders

- Public views expose safe product data only.
- Internal Lab and evaluation data stay internal.
- Supabase migrations are applied manually through SQL Editor.
- Do not use betting odds or provider predictions as hidden model inputs.
