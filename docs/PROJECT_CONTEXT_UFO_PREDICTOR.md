# PROJECT CONTEXT — UFO Predictor

_Last updated: post C07 / pre C08_

Current baseline: `main` is post PR #32 (`Feature/c07 premium match projection`). C01–C07 are functionally closed. Next major block: C08 — Trust / Transparency Real v0.1.


## What UFO Predictor Is

UFO Predictor is a football prediction product focused on probabilistic match analysis.

It is not a sportsbook and does not accept bets.

The product should communicate probabilities, uncertainty, and context responsibly.

## Product Principle

```txt
The statistical model calculates.
The AI explains.
```

## Current Product Strategy

The funnel is:

```txt
Anonymous -> Registered Free -> World Cup premium packages -> post-World-Cup monthly subscriptions
```

Registered Free is permanent.

World Cup premium should be package/pass/unlock based.

Monthly subscriptions are expected after the World Cup for recurring league coverage.

## Current User Experience

### Anonymous

Can see:

- public predictions;
- full 1X2 probabilities;
- match detail;
- confidence/risk teaser;
- CTAs to register.

Cannot:

- receive confidence/risk DTO fields;
- save matches;
- access premium payload.

### Registered Free

Can:

- see full public prediction context;
- receive confidence/risk;
- save/remove public matches;
- view saved matches in dashboard.

Still cannot:

- access premium match payload;
- purchase packages;
- unlock premium markets/narratives/results.

### Premium / World Cup Package User

Foundation implemented through C06/C07, but checkout and purchase fulfillment are not implemented yet.

C06 prepared World Cup package/pass/unlock foundations, canonical access keys, pricing preview, and materialization simulation. C07 implemented entitled premium projection behind a server-side access gate and protected RPC.

Current limitation: no payment provider, package catalog persistence, 10 Match Pack ledger, or checkout/fulfillment flow exists yet.

## Current Technical State

- Public predictions are backed by Supabase views.
- Public match detail is backed by Supabase views.
- Plans/entitlements backend exists.
- Premium access resolver exists and C07 serves whitelisted premium projection only behind authorized gate/RPC.
- Saved matches table exists with RLS.
- `prediction_results` remains excluded from product premium projection.

## Current Data Safety Rules

- Do not expose premium tables publicly.
- Do not use service role for normal UI.
- Do not treat visual locks as authorization.
- Do not send sensitive payload to unauthorized clients.
- Anonymous vs Registered Free payload differences should happen server-side, not only in CSS or copy.

## Current Operational Rules

- PowerShell/Git for simple commands.
- Codex for implementation/inspection.
- Feature branches may contain multiple commits.
- Merge to main only when a functional block is complete.
- Documentation refresh happens at stage/handoff, not every micro-step.

## Current Next Step

C06 — World Cup Premium Package Foundation.

Goal:

Prepare World Cup commercial packages and their access mapping without serving premium prediction payload yet.

## Current Context After C07

UFO Predictor now has:

- public/freemium prediction surfaces;
- Registered Free value wall and saved matches;
- World Cup package/access foundation;
- protected entitled premium match projection.

Next context:

C08 should make trust/transparency real without exposing internal lab data unsafely.

Payment work remains future. PayPal is a likely candidate, Stripe is not assumed because of Colombia-based constraints.


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
