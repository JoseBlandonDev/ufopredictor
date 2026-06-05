# DATA DICTIONARY — UFO Predictor

_Last updated: post C08 / Track D D04C (2026-06-05)_

Current baseline:

- `main` includes C08 Trust / Transparency Real v0.1 through PR #34.
- `feature/d02-api-football-read-spike` contains Track D read-only API-Football work through D04C.
- C01-C08 are functionally closed.
- D02-D04C are implemented locally on the Track D feature branch.
- API-Football Pro is validated as the initial football data provider.
- Next major block: D05 fixture ingestion/persistence design, unless D04D exportable shortlist/report is chosen first.


This dictionary summarizes current project data structures relevant to public product, freemium access, entitlements, saved matches, and future premium work.

<!-- POST_C08_D04C_UPDATE -->
## Post C08 / Track D Application-Layer Data Concepts

These are application-layer/pre-persistence concepts added during the API-Football read-only spike. They are not database schema yet.

| Concept | Layer | Meaning |
|---|---|---|
| `ProviderLeague` | API provider normalization | Normalized competition/league returned from API-Football. |
| `ProviderFixture` | API provider normalization | Normalized fixture returned from API-Football, including fixture ID, teams, kickoff, status, and score. |
| `ProviderFixtureStatus` | API provider normalization | Normalized status family such as scheduled, finished, cancelled, live/halftime. |
| `TargetCompetition` | Application config | UFO-selected provider competition with key, leagueId, season, and use case. |
| `TargetCompetitionKey` | Application config | Stable internal key such as `world-cup`, `friendlies`, `colombia-primera-a`, `copa-colombia`. |
| `TargetCompetitionUseCase` | Application config | Intended use such as `core_world_cup`, `beta_pre_world_cup`, `beta_local`, `beta_local_alt`. |
| `BetaFixtureCandidate` | Application selector | Fixture selected as potentially useful for beta/lab operations. |
| `PrioritizedBetaFixtureCandidate` | Application selector | Candidate with score, priority, and readable reasons. |
| `BetaShortlistReport` | Application report | Grouped report separating upcoming, finished, active, summaries, and recommendations. |

Lab v0.1 should treat `copa-colombia` as mapped/available but excluded from default selection. If a future database schema is introduced, these concepts should be reviewed before being converted into tables/columns.

Persistence warning:

- Do not create fixture tables directly from these types without D05 design.
- Do not expose provider IDs as product IDs without a mapping strategy.
- Do not connect these concepts to `prediction_results` without explicit evaluation-boundary review.

## Current Applied Migration Level

Remote Supabase is applied through:

```txt
0016_premium_match_projection.sql
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
0016_premium_match_projection.sql
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

## C07 Data Additions

### `public.public_match_details` after `0015_public_match_access_context.sql`

Purpose remains public/free match detail projection, now also serving public-safe server-side access context for premium gating.

Additional C07 public-safe columns:

| Column | Purpose | Sensitivity |
|---|---|---|
| `competition_id` | UUID for server-side access context | Public-safe ID |
| `competition_access_key` | Canonical competition key, e.g. `world_cup_2026` | Public-safe access key |
| `home_team_id` | Home team UUID for team entitlements | Public-safe ID |
| `away_team_id` | Away team UUID for team entitlements | Public-safe ID |

`competition_access_key` normalizes `world-cup-2026` to `world_cup_2026`. Other slugs use stable dash-to-underscore normalization.

### `public.get_premium_match_projection(p_match_id uuid)` after `0016_premium_match_projection.sql`

Purpose:

Protected premium product projection RPC for authorized match premium payload.

Security:

- `SECURITY DEFINER` with safe `search_path`.
- `auth.uid()` required.
- `anon` cannot execute.
- `authenticated` can execute.
- DB-side authorization checks unlocks/entitlements before returning payload.
- No service role is used by normal UI.
- Does not expose `prediction_results`.

Returns JSON with allowed:

- premium markets: `btts`, `over_2_5`, `exact_score`, `match_winner` when premium and available;
- premium narrative fields: `locale`, `premium_analysis`, `why_it_changed`, `risk_notes`.

Does not return:

- `prediction_results`;
- internal lab evaluation metrics;
- raw/debug fields;
- payment/checkout data.

### Premium Projection DTO Concepts

C07 introduced safe DTO states:

- `locked` — no payload.
- `unavailable` — no payload.
- `authorized_unavailable` — access authorized, but RPC returned null/error/no payload.
- `authorized` — payload present and filtered through allowed selectors.


---

## Post C07 Baseline Update

Current merged baseline:

```txt
main includes PR #31 — Feature/c06 world cup package foundation
main includes PR #32 — Feature/c07 premium match projection
Completed: C01–C07
Next: C08 — Trust / Transparency Real v0.1
Supabase remote manually applied through: 0016_premium_match_projection.sql
```

### C06 Closure Summary

C06 — World Cup Premium Package Foundation is complete.

Implemented:

- C06B: World Cup package mapping helpers.
- C06D: World Cup 2026 pricing preview without checkout.
- C06E: pure package intent materialization simulation without DB writes.
- C06G: canonical World Cup access keys.
- C06C: explicitly resolved as a defer decision, not forgotten.

C06C decision:

- No DB package catalog yet.
- No `plans` / `plan_features` seeds for World Cup packages yet.
- No `package_catalog` table yet.
- No 10 Match Pack ledger yet.

Reason: World Cup packages are still flexible commercial templates, not final persisted products. The project needs room for team-only passes, group passes, stage passes from octavos/cuartos/semis/final, semifinals/final bundles, single-match unlocks, flexible match packs, and other demand-based combinations.

### C07 Closure Summary

C07 — Entitled Premium Match Projection is complete.

Implemented:

- C07A: `PremiumMatchResource` contract and canonicalization.
- C07B.1: public-safe match access context SQL.
- C07B.2: server-side premium access gate context.
- C07C: premium projection contract and shaping helper.
- C07D: `premiumProjection` wired into match detail DTO.
- C07E.1: allowed premium payload selectors.
- C07E.2: protected premium match projection RPC.
- C07E.3: protected premium query integration and minimal authorized rendering.

C07 security boundary:

- Premium payload is queried only when `premiumAccess.status === "authorized"`.
- `locked` and `unavailable` never call the premium RPC and never contain payload.
- Authorized null/error responses become `authorized_unavailable`.
- Premium payload is filtered through selectors/whitelists before DTO output.
- `prediction_results` remains excluded from product premium projection.
- No service role is used for normal UI.
- No checkout, PayPal, Stripe, or payments were implemented.
- No entitlement/unlock inserts were implemented.

### C07 SQL Applied Manually

Remote Supabase was manually updated through:

```txt
0016_premium_match_projection.sql
```

New C07 migrations applied manually and validated:

- `0015_public_match_access_context.sql`
  - extends `public_match_details` with public-safe access context:
    `competition_id`, `competition_access_key`, `home_team_id`, `away_team_id`.
- `0016_premium_match_projection.sql`
  - creates `public.get_premium_match_projection(p_match_id uuid)`.
  - `SECURITY DEFINER` with safe `search_path`.
  - `anon` cannot execute.
  - `authenticated` can execute.
  - `auth.uid()` is required.
  - returns only allowed premium markets/narratives after DB-side authorization.
  - does not expose `prediction_results`.

### Payments / Provider Decision

Do not assume Stripe.

Because the project/user is Colombia-based, Stripe should not be assumed available directly without a supported-country structure such as an LLC/company in a supported country.

PayPal is currently a likely candidate. Other Colombia-compatible payment gateways must be evaluated before checkout/fulfillment.

No checkout, PayPal integration, Stripe integration, or payments were implemented in C06/C07.

### Workflow Decisions To Preserve

SQL/migrations:

- Codex may create SQL files/migrations.
- The user applies SQL manually in Supabase SQL Editor.
- Never assume a migration is applied remotely until the user confirms validation results.
- SQL validation queries must be provided with migrations.
- Current remote is manually applied through `0016_premium_match_projection.sql`.

Git:

- The user handles simple Git manually.
- During an epic/feature branch, use small local commits per logical subtask.
- Do not push for every subtask.
- Push/PR when the full functional block is ready for review/merge, unless backup/review requires earlier push.
