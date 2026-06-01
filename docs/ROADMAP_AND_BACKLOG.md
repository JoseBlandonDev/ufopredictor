# ROADMAP AND BACKLOG — UFO Predictor

_Last updated: post C07 / pre C08_

Current baseline: `main` is post PR #32 (`Feature/c07 premium match projection`). C01–C07 are functionally closed. Next major block: C08 — Trust / Transparency Real v0.1.


## Roadmap Overview

Completed foundation:

1. Lab/Admin foundations.
2. Public predictions from DB.
3. Plans/entitlements backend.
4. Public match detail from DB.
5. Premium access enforcement skeleton.
6. Anonymous vs Registered Free freemium boundary.
7. Registered Free saved matches/watchlist foundation.

Next major block:

```txt
C08 — Trust / Transparency Real v0.1
```

## Completed C05

C05 is complete.

Delivered:

- Registered Free value wall;
- presentation boundary;
- server-side anonymous payload shaping;
- saved matches/watchlist foundation;
- dashboard saved matches list.

Not included:

- saved button in `/predictions` cards;
- notifications;
- preferences;
- analytics events;
- premium payload.

These remain optional future enhancements, not blockers for C06.

## C06 — World Cup Premium Package Foundation

Goal:

Prepare World Cup commercial package foundation without serving premium payload yet.

Candidate package products:

- World Cup Full Pass;
- 10 Match Pack;
- Single Match Unlock;
- Country/Team Pass;
- Group Pass;
- Stage Pass;
- Semifinals / Final Pass.

Possible work:

- package catalog decisions;
- product copy/positioning;
- mapping package types to entitlements/unlocks;
- resource ID conventions;
- admin/seeding approach;
- pure tests for package mapping;
- pricing UI roadmap refinement.

Non-scope unless explicitly approved:

- checkout;
- Stripe;
- payment flows;
- serving premium match payload;
- opening premium prediction tables.

## C07 — Entitled Premium Match Projection

Goal:

Serve protected premium match content only to authorized users.

Potential scope:

- server-side premium projection;
- entitlement/access checks;
- RLS/RPC/views if needed;
- `prediction_markets` / `prediction_narratives` / `prediction_results` only through authorized projection;
- tests.

## C08 — Trust / Transparency Real v0.1

Goal:

Replace simulated transparency with real, scoped trust signals.

Must distinguish:

- internal Lab results;
- beta calibration;
- public trust-eligible predictions.

## Track D — Data Intake / Sports API

Goal:

Select and integrate a sports data provider.

Criteria:

- World Cup coverage;
- fixture quality;
- results speed;
- pricing;
- quotas;
- reliability.

## Track D/E — Workers Runtime

Goal:

Replace mock worker runs with real scheduled/background processing.

Potential scope:

- prediction generation workers;
- result ingestion workers;
- evaluation workers;
- monitoring and retries.

## Track E — Payments / Packages / Subscriptions

Goal:

Implement payments when product/package scope is explicit.

Expected direction:

- World Cup packages first;
- post-World-Cup monthly subscriptions later.

## Track F — Odds / LLM Explanations

Deferred.

Odds require product/legal/commercial readiness.

LLM explanations must follow model outputs, not invent probabilities.

## Track G — Platform Maturity

Potential scope:

- Google Auth;
- i18n EN/ES;
- staging;
- observability;
- release process;
- performance/cost control.

## Backlog: Optional C05 Enhancements

Optional later enhancements:

- save/remove from `/predictions` cards;
- richer dashboard saved match actions;
- favorite teams;
- favorite competitions;
- watchlist reminders;
- interest events.

Do not block C06 on these.

## Process Backlog / Rules

- Use longer feature branches when the work is one coherent functional block.
- Avoid micro-PRs for recognition/planning.
- Refresh docs at stage close/handoff.
- Keep Codex focused on implementation/inspection, not terminal chores.


## Expanded Backlog Context

The roadmap below preserves upcoming work without implying all items must be implemented immediately.

### Optional C05 follow-ups, not blockers for C06

- Add saved-match toggle to `/predictions` cards.
- Add remove action directly from dashboard saved-match list.
- Add lightweight saved-match count/badge in navigation or dashboard header.
- Add user preference capture for favorite teams/competitions.
- Add analytics/event tracking for registration and saved-match interactions.

These are useful, but C05 is already functionally complete enough to move to C06.

### C06 — World Cup Premium Package Foundation

Purpose:

- Define the World Cup package catalog and access mapping.
- Prepare purchase/unlock data model decisions.
- Keep premium prediction payload closed.

Expected product candidates:

- World Cup Full Pass.
- 10 Match Pack.
- Single Match Unlock.
- Country/Team Pass.
- Group Pass.
- Stage Pass.
- Semifinals / Final Pass.

Key decisions for C06:

- How package resources map to canonical resource IDs.
- How a 10 Match Pack materializes explicit `user_match_unlocks`.
- Whether package purchase UI is catalog preview only or checkout-ready.
- Whether payments are still deferred or begin in C06.
- Which admin/manual tooling is needed to grant/test packages.

Non-goals for C06:

- Do not expose `prediction_markets` to public/product UI.
- Do not expose `prediction_narratives` to public/product UI.
- Do not expose `prediction_results` to public/product UI.
- Do not serve xG, scorelines, model-vs-market, Golden Hour Delta, or premium analysis.

### C07 — Entitled Premium Match Projection

Purpose:

- Serve protected premium match content only after authorization is enforced server-side.
- Consume the C04 access resolver and C06 package/unlock model.
- Introduce premium projection/query layer with explicit tests and validation.

Potential implementation approaches:

- Server-only query shaping.
- Entitled views/RPC.
- RLS where appropriate.
- Separate public/free and premium DTOs.

### C08 and later tracks

Potential later work:

- Payments/Stripe checkout.
- Sports API integration and workers.
- Odds provider integration, if legally/product-approved.
- LLM narrative layer following the rule: model calculates, AI explains.
- Trust/transparency surface backed by eligible public prediction history.
- i18n EN/ES.
- Google Auth and broader auth polish.
- Staging/production hardening and observability.

## Merge Strategy Going Forward

Use one feature branch per coherent functional block. Multiple internal commits are fine. Merge to `main` only when the block delivers coherent value or closes a stage/handoff. Avoid PRs for every recognition step, minor copy update, or intermediate implementation fragment.

## Roadmap Update — Post C07

C06 and C07 are complete.

Next:

```txt
C08 — Trust / Transparency Real v0.1
```

C08 should replace simulated trust/transparency surfaces with real, safe evidence. It must preserve the C07 premium boundary and keep `prediction_results` out of product UI unless a dedicated safe projection is explicitly designed.

### Future Payment / Package Backlog

Payment/provider work moves to a later payments/fulfillment track. Do not assume Stripe. Evaluate PayPal and other Colombia-compatible providers.

Package catalog persistence remains deferred until product/package/pricing/provider strategy is clearer.


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
