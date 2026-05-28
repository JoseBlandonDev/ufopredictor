# DATA DICTIONARY — UFO Predictor

_Last updated: post PR #26 / C05 Gate 1 Registered Free Value Wall_

This dictionary documents project concepts, not only DB columns.

## User/access concepts

### Anonymous

Unauthenticated visitor. Sees public/basic surfaces only.

### Registered Free

Authenticated free user. Permanent free state, not a temporary beta plan. Receives value beyond anonymous through previews/messaging now and selected preview access later.

### World Cup premium package

Paid package/pass expected for World Cup monetization. Candidate package types include full tournament, match pack, country/team, group, stage, and single match unlock.

### Post-World Cup subscription

Monthly recurring subscription expected after the World Cup for American/European league coverage.

## Access resolver concepts

### `PremiumMatchResource`

Pure resource model used to decide access for match-level premium content. It should use internal IDs and server-derived metadata, not client-trusted slugs.

### `stageAccessKey`

Canonical server-derived key for stage access. Example:

```text
competitionId:stage
```

Never authorize by loose stage names alone.

### `trustedBetaFreeMatchIds`

Server-side trusted list of match IDs for selected previews/beta access. Must not come from query params or client input.

### `user_match_unlocks`

Represents explicit match-level access for a user. Match packs should eventually materialize into unlocks or equivalent explicit rights.

### `user_entitlements`

Represents user rights by resource type, such as match, competition, team, stage, or global. Do not treat subscription existence alone as content access.

## Public projections

### `public_prediction_summaries`

Public prediction summary projection used by `/predictions` and match detail. C05 Gate 2 may decide if a stricter anonymous projection is required.

### `public_match_details`

Public/free-only match detail projection used by `/matches/[slug]`.

## Sensitive/premium tables

These remain closed to public product surfaces:

- `prediction_markets`
- `prediction_narratives`
- `prediction_results`

Access to derived premium payload must be designed later through safe projection/RPC/server-only query and C04 enforcement.

## Language conventions

- UI copy currently Spanish.
- Future public UI should support EN/ES.
- Internal identifiers, types, keys, and model terminology should prefer canonical English.
