# DATA DICTIONARY — UFO Predictor

_Last updated: post C05 / pre C06_

Current baseline: `main` is post PR #29 (`Feature/registered free saved matches`). C05 is functionally closed. Next major block: C06 — World Cup Premium Package Foundation.


This dictionary summarizes current project data structures relevant to public product, freemium access, entitlements, saved matches, and future premium work.

## Current Applied Migration Level

Remote Supabase is applied through:

```txt
0014_user_saved_matches.sql
```

## Public Views

### `public.public_match_details`

Purpose:

Public/free match detail projection for `/matches/[slug]` and saved-match metadata.

Columns:

| Column | Purpose | Sensitivity |
|---|---|---|
| `match_slug` | Public route identifier | Public |
| `kickoff_at` | Match kickoff | Public |
| `stage` | Stage/round text | Public |
| `status` | Match status | Public |
| `competition_name` | Competition display name | Public |
| `competition_slug` | Competition route/key | Public |
| `home_team_name` | Home team display | Public |
| `home_team_slug` | Home team key | Public |
| `home_team_logo_url` | Home logo | Public |
| `home_team_flag_url` | Home flag | Public |
| `away_team_name` | Away team display | Public |
| `away_team_slug` | Away team key | Public |
| `away_team_logo_url` | Away logo | Public |
| `away_team_flag_url` | Away flag | Public |
| `venue_name` | Venue | Public |
| `venue_city` | Venue city | Public |
| `match_id` | UUID used server-side for saved matches | Public-safe, limited purpose |

Important note:

`match_id` is exposed here to allow server-side saved-match resolution for public matches without service role and without reading `public.matches` directly from normal UI paths.

### `public.public_prediction_summaries`

Purpose:

Public prediction list and summary projection for `/predictions`.

Columns include:

- match/competition/team metadata;
- `prediction_created_at`;
- `home_win_prob`;
- `draw_prob`;
- `away_win_prob`;
- `confidence_score`;
- `risk_level`.

Important note:

`public_prediction_summaries` does not expose `match_id`.

After C05 Gate 2B, Anonymous does not receive `confidenceScore` / `riskLevel` in shaped UI DTO even though the public view contains source columns.

## Registered Free Capture

### `public.user_saved_matches`

Introduced in:

```txt
0014_user_saved_matches.sql
```

Purpose:

Stores public matches saved by authenticated/Registered Free users.

Columns:

| Column | Type | Required | Default | Notes |
|---|---|---:|---|---|
| `id` | `uuid` | Yes | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | Yes | none | FK to `auth.users(id)` on delete cascade |
| `match_id` | `uuid` | Yes | none | FK to `public.matches(id)` on delete cascade |
| `saved_at` | `timestamptz` | Yes | `now()` | Timestamp for dashboard ordering |

Constraints:

- primary key on `id`;
- foreign key `user_id -> auth.users(id)`;
- foreign key `match_id -> public.matches(id)`;
- unique `(user_id, match_id)`.

Indexes:

- `user_saved_matches_user_id_idx` on `(user_id)`;
- `user_saved_matches_match_id_idx` on `(match_id)`;
- unique index for `(user_id, match_id)`.

RLS / grants:

- RLS enabled.
- `authenticated`: `SELECT`, `INSERT`, `DELETE`.
- `anon`: no access.
- No `UPDATE` policy.
- Users can only read/insert/delete rows where `user_id = auth.uid()`.

Usage:

- `/matches/[slug]` uses server actions to save/remove public matches.
- `/dashboard` lists saved matches using `user_saved_matches` plus `public_match_details`.

## Entitlements / Access Tables

Existing backend from C02/C04 includes:

- `plans`
- `plan_features`
- `subscriptions`
- `user_entitlements`
- `user_match_unlocks`

Access rules:

- visible plans/packages are commercial surface;
- granular internal entitlements/unlocks drive access;
- `premium_user` is not enough by itself;
- active subscription is not enough by itself;
- match packs must materialize explicit unlocks.

## Premium/Internal Prediction Tables

Remain closed to public product UI:

- `prediction_markets`
- `prediction_narratives`
- `prediction_results`

Do not expose these until C07 or an explicitly approved premium projection gate.

## Key Canonical Access Concepts

### `stageAccessKey`

Canonical server-derived key for stage entitlements.

Expected shape:

```txt
competitionId:stage
```

Do not derive from client input or raw display text.

### `trustedBetaFreeMatchIds`

Trusted server-side set of beta/free matches.

Must never come from client/query params.

## Future Data Areas

Potential future tables/fields:

- package catalog / World Cup passes;
- package-to-entitlement mapping;
- match pack consumption ledger;
- favorites/preferences;
- interest events;
- premium match projection DTOs;
- transparency/trust metrics.

Add only when approved by scope.


## Additional Table Context and Access Notes

### `public.user_saved_matches`

Purpose:

Stores Registered Free saved public matches / watchlist entries.

Columns:

| Column | Type | Purpose |
|---|---|---|
| `id` | uuid | Primary key, default `gen_random_uuid()` |
| `user_id` | uuid | FK to `auth.users(id)`, cascade delete |
| `match_id` | uuid | FK to `public.matches(id)`, cascade delete |
| `saved_at` | timestamptz | Timestamp of save action, default `now()` |

Constraints and indexes:

- Primary key on `id`.
- Unique `(user_id, match_id)` to prevent duplicate saved rows.
- Index on `user_id`.
- Index on `match_id`.
- FK to `auth.users(id)`.
- FK to `public.matches(id)`.

RLS and grants:

- RLS enabled.
- `authenticated`: `SELECT`, `INSERT`, `DELETE` only.
- `anon`: no access.
- No `UPDATE` policy.
- Own-row policies use `user_id = auth.uid()`.

Operational note:

Remote grants were explicitly corrected after validation so `authenticated` does not retain broad `UPDATE`, `TRUNCATE`, `TRIGGER`, or `REFERENCES` privileges.

### `public.public_match_details`

Current purpose:

- Public/free match detail projection for `/matches/[slug]`.
- Metadata source for dashboard saved-match list.
- Server-side `slug -> match_id` resolution for saved-match actions.

Current notable column:

- `match_id` is exposed as public-safe UUID for public matches only. It exists to allow saved-match FK usage without service role and without reading `public.matches` directly from normal UI code.

### `public.public_prediction_summaries`

Current purpose:

- Public predictions list and summary source for `/predictions`.

Important boundary:

- Does not expose `match_id`.
- Carries public 1X2 probabilities from approved public prediction versions.
- `confidence_score` / `risk_level` may exist in the view, but Anonymous payload is shaped server-side so those fields are not sent to Anonymous UI DTOs.

### Premium/internal prediction tables

The following remain closed to normal public UI and must not be opened in C06:

- `prediction_markets`
- `prediction_narratives`
- `prediction_results`

C06 may model package access, but premium prediction payload serving belongs to C07 or a later explicitly approved gate.

### Entitlement-related concepts to preserve

- `premium_user` role alone does not unlock protected content.
- Active subscription alone does not unlock protected content.
- `quantity/match_pack` does not directly authorize content; it should materialize explicit match unlocks.
- Canonical `stageAccessKey` should be server-derived.
- Trusted beta/free match grants must come from server-side trusted context, never from client/query params.
