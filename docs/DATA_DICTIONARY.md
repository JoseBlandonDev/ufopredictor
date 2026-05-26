# DATA DICTIONARY — UFO Predictor

_Last updated: post PR #21 / C02 Plans & Entitlements Backend_

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

## Core Product Tables

### `competitions`

Represents competitions.

Used by:

- Lab fixtures;
- public predictions;
- future match detail.

Public reads require `usage_scope = 'public_product'`.

### `matches`

Represents fixtures/matches.

Used by:

- Lab Admin;
- public predictions;
- future match detail.

Public reads require:

- `access_scope = 'public'`;
- associated competition is `public_product`.

### `teams`

Represents teams.

Public reads are allowed only when teams are used by public product matches.

### `venues`

Represents venues.

Public reads are allowed only when venues are used by public product matches.

### `prediction_versions`

Represents generated prediction versions.

Public reads require:

- `run_scope = 'public_product'`;
- associated match is public;
- associated competition is public product.

## Lab / Evaluation Tables

### `prediction_markets`

Represents markets and market-level predictions.

Currently internal/premium-sensitive.

Not publicly open.

### `prediction_results`

Represents persisted evaluation results for predictions.

Used by Lab Admin.

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
- whether premium projections use views, RPC, or server-only queries.
