# PROJECT STATUS FOR MEETING — UFO Predictor

_Last updated: post C07 / pre C08_

Current baseline: `main` is post PR #32 (`Feature/c07 premium match projection`). C01–C07 are functionally closed. Next major block: C08 — Trust / Transparency Real v0.1.


## One-Line Status

UFO Predictor has completed the public/freemium foundation through C05 and is ready to plan World Cup premium packages in C06.

## What Is Working

- Public predictions from Supabase.
- Public match detail from Supabase.
- Plans and entitlements backend.
- Registered Free value wall.
- Anonymous vs Registered Free payload boundary.
- Saved matches/watchlist for Registered Free.
- Dashboard saved matches list.
- Premium access enforcement skeleton.

## Recent Completed Work

### PR #28

Server-side shaping for Anonymous prediction payload.

Result:

- Anonymous keeps public 1X2.
- Anonymous no longer receives confidence/risk DTO fields.
- Registered Free receives confidence/risk.

### PR #29

Registered Free saved matches foundation.

Result:

- users can save/remove public matches from match detail;
- dashboard shows saved matches;
- `user_saved_matches` table added with RLS;
- Supabase migrated manually through `0016_premium_match_projection.sql`.

## Current Product Value

Anonymous users can discover prediction value.

Registered Free users now get additional value:

- richer confidence/risk context;
- saved matches/watchlist;
- dashboard utility.

Premium payload remains protected and not yet implemented.

## Current Risks / Watch Items

- C06 package design must not accidentally serve premium payload.
- Premium access must continue relying on explicit entitlements/unlocks.
- Payments/checkout should not start until package scope is explicit.
- Trust/transparency remains simulated and should not be overclaimed.

## Next Recommended Work

```txt
C08 — Trust / Transparency Real v0.1
```

Focus:

- define World Cup packages/passes/unlocks;
- map packages to entitlements/unlocks;
- decide if SQL/catalog changes are needed;
- avoid premium payload until C07.

## Not Yet Implemented

- checkout/Stripe;
- entitled premium prediction payload;
- prediction markets/narratives/results serving;
- odds provider;
- sports API provider;
- LLM narrative layer;
- real transparency/trust dashboard;
- i18n EN/ES;
- staging/observability finalization.

## Meeting Update — Post C07

One-line status:

UFO Predictor has completed C01–C07, including protected premium match projection behind a server-side access gate. Next planned block is C08 — Trust / Transparency Real v0.1.

### Recently Completed

- PR #31: World Cup package foundation.
- PR #32: Entitled premium match projection.

### Current Strategic Notes

- Premium projection now works behind authorization boundaries.
- `prediction_results` remains excluded from product UI.
- World Cup package catalog persistence is deferred until package/pricing/payment strategy is clearer.
- Payment provider remains open; PayPal is likely, Stripe is not assumed for Colombia-based setup.


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
