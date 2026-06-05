# NEXT EPICS PLAN — UFO Predictor

_Last updated: post C08 / Track D D04C (2026-06-05)_

Current baseline:

- `main` includes C08 Trust / Transparency Real v0.1 through PR #34.
- `feature/d02-api-football-read-spike` contains Track D read-only API-Football work through D04C.
- C01-C08 are functionally closed.
- D02-D04C are implemented locally on the Track D feature branch.
- API-Football Pro is validated as the initial football data provider.
- Next major block: D05 fixture ingestion/persistence design, unless D04D exportable shortlist/report is chosen first.

<!-- POST_C08_D04C_UPDATE -->
## Post C08 / Track D Next Epics Update

Immediate state:

- C08 closed as product-safe transparency v0.1.
- Track D read-only provider and beta selection completed through D04C.
- API-Football Pro validated 2026 data access.

Recommended next options:

### Option 1 — D04D Exportable Shortlist Report

Use this if the project wants one more no-DB step.

Scope:

- export `beta-candidates --report true` output to local JSON/Markdown/CSV;
- keep it manual/read-only;
- no Supabase;
- no DB writes.

### Option 2 — D05 Fixture Persistence Design

Use this if the project is ready to design persistence.

Scope:

- design fixture tables/mapping/upsert strategy;
- define RLS and public/internal boundaries;
- decide what is provider-owned vs UFO-owned;
- only then create migrations.

Recommendation:

Move to D05A in a clean conversation if the goal is product progress. Choose D04D only if the team wants a manual export artifact before touching database design.

## Current Position

Completed:

- C01 — Public Predictions From DB
- C02 — Plans & Entitlements Backend
- C03 — Match Detail Public From DB
- C04 — Premium Access Enforcement Skeleton
- C05 — Anonymous vs Registered Free Foundation
- C06 — World Cup Premium Package Foundation
- C07 — Entitled Premium Match Projection

Current app state:

- `/predictions` reads real public predictions from `public_prediction_summaries`.
- `/matches/[slug]` reads public match detail and now includes protected premium projection states.
- `/pricing` shows current plans and World Cup package preview without checkout.
- `/dashboard` reads real viewer access summary and saved matches.
- `/admin/beta-lab` remains operational.
- Premium match payload is only queried behind the C07 server-side access gate and protected RPC.
- `prediction_results` remains excluded from product premium projection.

## Recommended Next Epic: C08

```txt
C08 — Trust / Transparency Real v0.1
```

Goal:

Replace simulated/placeholder transparency with real product-facing trust evidence while preserving premium and internal-lab boundaries.

Initial C08 work should be recognition/design first:

- inspect current transparency route/surface;
- identify simulated claims/copy;
- decide which real metrics or evaluation summaries can be safely shown;
- do not expose `prediction_results` directly;
- do not use service role;
- do not implement payment/provider work.

C08 should build on C07's protected premium projection but should not casually expand it.


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
