# ARCHITECTURE SUMMARY — UFO Predictor

_Last updated: post C07 / pre C08_

Current baseline: `main` is post PR #32 (`Feature/c07 premium match projection`). C01–C07 are functionally closed. Next major block: C08 — Trust / Transparency Real v0.1.


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

## C07 Premium Projection Architecture

C07 introduced a protected premium projection architecture:

```txt
public match detail
→ public-safe access context
→ PremiumMatchResource
→ server-side access gate
→ premiumProjection DTO
→ protected RPC only when authorized
→ selector-filtered payload
→ minimal authorized rendering
```

Key components:

- `lib/permissions/premium-match-resource.ts`
- `lib/permissions/premium-match-projection.ts`
- `lib/permissions/premium-match-projection-resolver.ts`
- `lib/supabase/public-match-detail-queries.ts`
- `public.get_premium_match_projection(p_match_id uuid)`

Security architecture:

- no service role for normal UI;
- RPC execution requires authenticated user;
- DB-side authorization mirrors entitlement/unlock constraints;
- `prediction_results` excluded;
- locked/unavailable states never call RPC.


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
