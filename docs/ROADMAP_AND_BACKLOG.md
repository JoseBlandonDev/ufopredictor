# ROADMAP AND BACKLOG — UFO Predictor

_Last updated: post C05 / pre C06_

Current baseline: `main` is post PR #29 (`Feature/registered free saved matches`). C05 is functionally closed. Next major block: C06 — World Cup Premium Package Foundation.


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
C06 — World Cup Premium Package Foundation
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
