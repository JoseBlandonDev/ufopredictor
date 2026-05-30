# ARCHITECTURE SUMMARY — UFO Predictor

_Last updated: post C05 / pre C06_

Current baseline: `main` is post PR #29 (`Feature/registered free saved matches`). C05 is functionally closed. Next major block: C06 — World Cup Premium Package Foundation.


## High-Level Architecture

UFO Predictor is a Next.js app backed by Supabase.

Main layers:

- public product routes;
- authenticated account/dashboard routes;
- internal Lab/Admin routes;
- Supabase public views and protected tables;
- pure permission/access helpers;
- future premium package/projection layer.

## Current Route Architecture

| Route | Data Source | Notes |
|---|---|---|
| `/` | mostly static/current marketing surface | May still include mock/static featured cards |
| `/predictions` | `public_prediction_summaries` | Public predictions; viewer-shaped DTO |
| `/matches/[slug]` | `public_match_details`, `public_prediction_summaries`, `user_saved_matches` | Public match detail + saved match toggle |
| `/pricing` | plan catalog tables | No checkout |
| `/dashboard` | entitlements/subscriptions + saved matches | Authenticated surface |
| `/admin/beta-lab` | internal Lab tables | Operational internal workflow |
| `/transparency` | simulated/mock | Future C08 real transparency |

## Supabase Boundary

Public views:

- `public_match_details`
- `public_prediction_summaries`

C05 added:

- `public.user_saved_matches`

Premium/internal tables remain closed:

- `prediction_markets`
- `prediction_narratives`
- `prediction_results`

## Public Views

### `public_match_details`

Exposes public match metadata and `match_id`.

`match_id` exists to resolve saved matches server-side for public matches without service role.

### `public_prediction_summaries`

Exposes public prediction summaries.

Does not expose `match_id`.

## Viewer-Specific DTO Shaping

C05 Gate 2B introduced server-side shaping:

- Anonymous receives public metadata + 1X2, without `confidenceScore` / `riskLevel` DTO keys.
- Registered Free receives metadata + 1X2 + confidence/risk.

This is not a premium projection. It is a free/registered-free payload boundary.

## Saved Matches Architecture

C05 Gate 3 introduced:

```txt
public.user_saved_matches
```

Use cases:

- Registered Free saves/removes public matches from `/matches/[slug]`.
- Dashboard lists saved matches.

Data flow:

1. `/matches/[slug]` resolves `match_slug` to `match_id` through `public_match_details`.
2. Server action inserts/deletes `user_saved_matches` row.
3. Dashboard reads user-owned saved rows.
4. Dashboard fetches public metadata via `public_match_details`.

RLS:

- own-row for authenticated;
- no anon access;
- no update policy.

## Entitlement Architecture

Existing C02/C04 architecture includes:

- `plans`
- `plan_features`
- `subscriptions`
- `user_entitlements`
- `user_match_unlocks`
- pure permission/access logic

Rules:

- `premium_user` alone is not authorization.
- Active subscription alone is not authorization.
- Explicit entitlements/unlocks drive access.
- Match packs should materialize explicit match unlocks.

## Future Premium Architecture

C06 should define package/pass/unlock foundation.

C07 should define protected premium match projection.

Premium payload must not be sent to unauthorized clients.

Potential C07 approaches:

- server-only projection;
- secure view/RPC;
- RLS policies;
- explicit access checks.

## Operational Architecture Rules

- Supabase migrations are applied manually by the user.
- Codex creates migration files but does not apply remote SQL.
- Simple terminal/Git work is manual.
- Codex is used for implementation and non-trivial inspection.
- Docs refresh at stage close/handoff, not every micro-step.
