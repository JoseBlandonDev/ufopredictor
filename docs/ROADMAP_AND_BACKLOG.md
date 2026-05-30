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
