# DATA DICTIONARY — UFO Predictor

_Last updated: post PR #23 / C03 Match Detail Public From DB_

This document summarizes the main database concepts used by current features. It is not a substitute for `types/database.ts` or migrations.

## Scope Fields

### `competitions.usage_scope`

Known usage:

- `internal_lab` — internal Lab only.
- `public_product` — allowed for public product surfaces.

### `matches.access_scope`

Known usage:

- `lab_only` — internal Lab only.
- `public` — public product.
- future premium/admin scopes may exist or be added later.

### `prediction_versions.run_scope`

Known usage:

- `internal_lab` — internal Lab predictions.
- `public_product` — public product predictions.

## Public Projection Views

C03 introduced explicit public projection views in `0013_public_match_detail_projection_hardening.sql`.

These views are now the public read boundary for anonymous users.

### `public_match_details`

Approved public/free-only match detail projection.

Exposes:

- `match_slug`
- `kickoff_at`
- `stage`
- `status`
- `competition_name`
- `competition_slug`
- `home_team_name`
- `home_team_slug`
- `home_team_logo_url`
- `home_team_flag_url`
- `away_team_name`
- `away_team_slug`
- `away_team_logo_url`
- `away_team_flag_url`
- `venue_name`
- `venue_city`

Filters internally:

- `matches.access_scope = 'public'`
- `competitions.usage_scope = 'public_product'`

Used by:

- `/matches/[slug]`

### `public_prediction_summaries`

Approved public/free-only prediction card/detail summary projection.

Includes the same public match metadata as `public_match_details`, plus:

- `prediction_created_at`
- `home_win_prob`
- `draw_prob`
- `away_win_prob`
- `confidence_score`
- `risk_level`

Filters internally:

- `matches.access_scope = 'public'`
- `competitions.usage_scope = 'public_product'`
- `prediction_versions.run_scope = 'public_product'`

Used by:

- `/predictions`
- `/matches/[slug]` when a public prediction exists

Important:

These views intentionally do not expose expected goals, scorelines, markets, narratives, results, odds, or premium analysis.

## Core Product Tables

### `competitions`

Represents competitions.

Used by:

- Lab fixtures;
- public predictions;
- public match detail;
- future premium match detail.

Public/free views require `usage_scope = 'public_product'`.

`anon` should not read this base table directly after C03.

### `matches`

Represents fixtures/matches.

Used by:

- Lab Admin;
- public predictions;
- public match detail;
- future premium match detail.

Public/free views require:

- `access_scope = 'public'`;
- associated competition is `public_product`.

`anon` should not read this base table directly after C03.

### `teams`

Represents teams.

Public team fields are exposed only through approved public views for public product matches.

### `venues`

Represents venues.

Public venue fields are exposed only through approved public views for public product matches.

### `prediction_versions`

Represents generated prediction versions.

Public/free predictions are exposed only through `public_prediction_summaries`.

Public/free view filters require:

- `run_scope = 'public_product'`;
- associated match is public;
- associated competition is public product.

Do not expose extra columns casually. Expected goals and scoreline fields are currently treated as outside the C03 public/basic projection.

## Lab / Evaluation Tables

### `prediction_markets`

Represents markets and market-level predictions.

Currently internal/premium-sensitive.

Not publicly open.

### `prediction_results`

Represents persisted evaluation results for predictions.

Used by Lab Admin.

Not publicly open.

### `prediction_narratives`

Represents generated or stored narratives/explanations.

Currently internal/premium-sensitive.

Not publicly open.

### `match_results`

Represents final match results entered/reviewed by admin flows.

Used for evaluation.

Not part of public product yet.

## Plans And Entitlements Tables

Implemented by C02 foundation.

### `plans`

Represents visible commercial/catalog plans.

Public reads are allowed only for active/current visible plans.

Current visible examples:

- Free
- 10 Match Pack
- World Cup Pass

Future examples:

- Team Pass
- Semifinals / Final Pass
- Premium Monthly

### `plan_features`

Represents public catalog/marketing features for plans.

Important:

Do not store secrets, internal authorization rules, or sensitive operational config in `plan_features`.

### `subscriptions`

Represents a user's subscription or plan state.

Authenticated users may read only their own rows.

A subscription alone does not unlock protected content.

### `user_entitlements`

Represents effective rights for a user.

Authenticated users may read only their own current rows.

Possible future resource types:

- `global`
- `competition`
- `stage`
- `team`
- `match`
- `match_pack`

Exact mapping to match access remains a future decision.

### `user_match_unlocks`

Represents explicit match-level unlocks.

Authenticated users may read only their own current rows.

Likely useful for:

- individual match purchases;
- 10 match pack selected matches;
- manually granted beta access.

## Access Concepts

Implemented in `lib/permissions/entitlements.ts`.

Access sources:

- `public_basic_access`
- `beta_free_access`
- `entitlement_access`
- `admin_access`
- `none`

Rules:

- Public resources are accessible without premium rights.
- Protected resources require entitlement/unlock/admin/beta access.
- Active subscription marks subscribed state but does not alone grant protected content.
- `premium_user` role alone does not unlock all premium content.

## Future Data Dictionary Work

Before premium match detail, define:

- free vs premium fields;
- entitlement-to-match resolution;
- stage/team/competition identifiers;
- pack consumption behavior;
- whether premium projections use views, RPC, or server-only queries;
- whether to further reduce broad `authenticated` base-table grants without breaking Lab/Admin.
